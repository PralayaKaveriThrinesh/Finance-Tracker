import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import MemoryStore from "memorystore";
import { ZodError } from "zod";

import {
  insertUserSchema,
  insertTransactionSchema,
  insertBudgetSchema,
  insertGoalSchema,
  insertCategorySchema,
  insertIncomeSchema,
  insertNotificationSchema,
  loginSchema,
  reportSchema,
  backupSchema,
  restoreSchema,
  type User
} from "@shared/schema";
import { randomBytes } from "crypto";

// Helper to handle Zod validation errors
const handleZodError = (err: unknown, res: Response) => {
  if (err instanceof ZodError) {
    return res.status(400).json({
      message: "Validation error",
      errors: err.errors
    });
  }
  console.error(err);
  return res.status(500).json({ message: "Internal server error" });
};

// Helper to ensure user is authenticated
const isAuthenticated = (req: Request, res: Response, next: Function) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Setup session
  const MemoryStoreSession = MemoryStore(session);
  app.use(session({
    secret: process.env.SESSION_SECRET || randomBytes(32).toString('hex'),
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 86400000 }, // 24 hours
    store: new MemoryStoreSession({
      checkPeriod: 86400000
    })
  }));
  
  // Setup passport
  app.use(passport.initialize());
  app.use(passport.session());
  
  passport.use(new LocalStrategy(async (username, password, done) => {
    try {
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return done(null, false, { message: "Invalid username or password" });
      }
      if (user.password !== password) { // In a real app, use bcrypt for password comparison
        return done(null, false, { message: "Invalid username or password" });
      }
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }));
  
  passport.serializeUser((user: Express.User, done) => {
    done(null, (user as User).id);
  });
  
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });
  
  // Auth routes
  app.post("/api/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUserByUsername = await storage.getUserByUsername(userData.username);
      if (existingUserByUsername) {
        return res.status(400).json({ message: "Username already taken" });
      }
      
      const existingUserByEmail = await storage.getUserByEmail(userData.email);
      if (existingUserByEmail) {
        return res.status(400).json({ message: "Email already registered" });
      }
      
      const user = await storage.createUser(userData);
      const { password, ...userWithoutPassword } = user;
      
      // Create welcome notification
      await storage.createNotification({
        userId: user.id,
        message: "Welcome to FinTrack! Start by adding your first transaction.",
        read: false
      });
      
      return res.status(201).json(userWithoutPassword);
    } catch (err) {
      return handleZodError(err, res);
    }
  });
  
  app.post("/api/login", (req, res, next) => {
    try {
      loginSchema.parse(req.body);
      
      passport.authenticate("local", (err: Error, user: User) => {
        if (err) return next(err);
        if (!user) {
          return res.status(401).json({ message: "Invalid username or password" });
        }
        
        req.logIn(user, (err) => {
          if (err) return next(err);
          
          const { password, ...userWithoutPassword } = user;
          return res.json(userWithoutPassword);
        });
      })(req, res, next);
    } catch (err) {
      return handleZodError(err, res);
    }
  });
  
  app.post("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Error logging out" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });
  
  app.get("/api/me", isAuthenticated, (req, res) => {
    const { password, ...userWithoutPassword } = req.user as User;
    res.json(userWithoutPassword);
  });
  
  // Notification routes
  app.get("/api/notifications", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as User;
      const notifications = await storage.getNotifications(user.id);
      res.json(notifications);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Error fetching notifications" });
    }
  });
  
  app.post("/api/notifications/:id/read", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const notification = await storage.markNotificationAsRead(id);
      
      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }
      
      res.json(notification);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Error marking notification as read" });
    }
  });
  
  app.post("/api/notifications/read-all", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as User;
      await storage.markAllNotificationsAsRead(user.id);
      
      res.json({ message: "All notifications marked as read" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Error marking all notifications as read" });
    }
  });
  
  app.post("/api/notifications", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as User;
      const notificationData = insertNotificationSchema.parse({
        ...req.body,
        userId: user.id
      });
      
      const notification = await storage.createNotification(notificationData);
      res.status(201).json(notification);
    } catch (err) {
      return handleZodError(err, res);
    }
  });
  
  // Category routes
  app.get("/api/categories", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as User;
      const categories = await storage.getCategories(user.id);
      res.json(categories);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Error fetching categories" });
    }
  });
  
  app.post("/api/categories", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as User;
      const categoryData = insertCategorySchema.parse({
        ...req.body,
        userId: user.id
      });
      
      // Check if category already exists
      const existing = await storage.getCategoryByName(user.id, categoryData.name);
      if (existing) {
        return res.status(400).json({ message: "Category with this name already exists" });
      }
      
      const category = await storage.createCategory(categoryData);
      res.status(201).json(category);
    } catch (err) {
      return handleZodError(err, res);
    }
  });
  
  // Transaction routes
  app.get("/api/transactions", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as User;
      const transactions = await storage.getTransactions(user.id);
      res.json(transactions);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Error fetching transactions" });
    }
  });
  
  app.post("/api/transactions", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as User;
      const transactionData = insertTransactionSchema.parse({
        ...req.body,
        userId: user.id
      });
      
      const transaction = await storage.createTransaction(transactionData);
      res.status(201).json(transaction);
      
      // Create notification for large expenses
      if (transaction.type === 'expense' && transaction.amount > 100) {
        await storage.createNotification({
          userId: user.id,
          message: `Large expense of $${transaction.amount.toFixed(2)} recorded for ${transaction.category}.`,
          read: false
        });
      }
    } catch (err) {
      return handleZodError(err, res);
    }
  });
  
  app.get("/api/transactions/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const transaction = await storage.getTransactionById(id);
      
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      
      // Security check: ensure user owns this transaction
      const user = req.user as User;
      if (transaction.userId !== user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      res.json(transaction);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Error fetching transaction" });
    }
  });
  
  app.patch("/api/transactions/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const transaction = await storage.getTransactionById(id);
      
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      
      // Security check: ensure user owns this transaction
      const user = req.user as User;
      if (transaction.userId !== user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const updatedTransaction = await storage.updateTransaction(id, req.body);
      res.json(updatedTransaction);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Error updating transaction" });
    }
  });
  
  app.delete("/api/transactions/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const transaction = await storage.getTransactionById(id);
      
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      
      // Security check: ensure user owns this transaction
      const user = req.user as User;
      if (transaction.userId !== user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      await storage.deleteTransaction(id);
      res.json({ message: "Transaction deleted successfully" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Error deleting transaction" });
    }
  });
  
  // Income routes
  app.get("/api/incomes", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as User;
      const incomes = await storage.getIncomes(user.id);
      res.json(incomes);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Error fetching incomes" });
    }
  });
  
  app.post("/api/incomes", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as User;
      const incomeData = insertIncomeSchema.parse({
        ...req.body,
        userId: user.id
      });
      
      const income = await storage.createIncome(incomeData);
      res.status(201).json(income);
    } catch (err) {
      return handleZodError(err, res);
    }
  });
  
  // Budget routes
  app.get("/api/budgets", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as User;
      const budgets = await storage.getBudgets(user.id);
      res.json(budgets);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Error fetching budgets" });
    }
  });
  
  app.post("/api/budgets", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as User;
      const budgetData = insertBudgetSchema.parse({
        ...req.body,
        userId: user.id
      });
      
      const budget = await storage.createBudget(budgetData);
      res.status(201).json(budget);
    } catch (err) {
      return handleZodError(err, res);
    }
  });
  
  app.patch("/api/budgets/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const budget = await storage.updateBudget(id, req.body);
      
      if (!budget) {
        return res.status(404).json({ message: "Budget not found" });
      }
      
      res.json(budget);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Error updating budget" });
    }
  });
  
  app.delete("/api/budgets/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteBudget(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Budget not found" });
      }
      
      res.json({ message: "Budget deleted successfully" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Error deleting budget" });
    }
  });
  
  // Goals routes
  app.get("/api/goals", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as User;
      const goals = await storage.getGoals(user.id);
      res.json(goals);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Error fetching goals" });
    }
  });
  
  app.post("/api/goals", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as User;
      const goalData = insertGoalSchema.parse({
        ...req.body,
        userId: user.id
      });
      
      const goal = await storage.createGoal(goalData);
      res.status(201).json(goal);
    } catch (err) {
      return handleZodError(err, res);
    }
  });
  
  app.patch("/api/goals/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updatedGoal = await storage.updateGoal(id, req.body);
      
      if (!updatedGoal) {
        return res.status(404).json({ message: "Goal not found" });
      }
      
      res.json(updatedGoal);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Error updating goal" });
    }
  });
  
  app.delete("/api/goals/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteGoal(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Goal not found" });
      }
      
      res.json({ message: "Goal deleted successfully" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Error deleting goal" });
    }
  });
  
  // Analytics routes
  app.get("/api/insights/spending", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as User;
      const insights = await storage.getSpendingByCategory(user.id);
      res.json(insights);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Error fetching spending insights" });
    }
  });
  
  app.get("/api/reports/spending", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as User;
      const report = await storage.getSpendingReport(user.id);
      res.json(report);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Error generating spending report" });
    }
  });
  
  app.get("/api/reports/download", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as User;
      const transactions = await storage.getTransactions(user.id);
      
      // Create CSV content
      const headers = "Date,Description,Category,Amount,Type\n";
      const rows = transactions.map(t => {
        const date = new Date(t.date).toISOString().split('T')[0];
        return `${date},"${t.description}",${t.category},${t.amount},${t.type}`;
      }).join('\n');
      
      const csv = headers + rows;
      
      // Set response headers for file download
      res.setHeader('Content-Disposition', 'attachment; filename="transactions.csv"');
      res.setHeader('Content-Type', 'text/csv');
      res.send(csv);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Error downloading report" });
    }
  });
  
  // Backup and Restore
  app.post("/api/backup", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as User;
      const data = await storage.createBackup(user.id);
      
      res.json(data);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Error creating backup" });
    }
  });
  
  app.post("/api/restore", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as User;
      const restoreData = restoreSchema.parse({
        ...req.body,
        userId: user.id
      });
      
      await storage.restoreBackup(user.id, restoreData.data);
      
      res.json({ message: "Data restored successfully" });
      
      // Create notification about the restore
      await storage.createNotification({
        userId: user.id,
        message: "Your data has been successfully restored.",
        read: false
      });
    } catch (err) {
      return handleZodError(err, res);
    }
  });

  return httpServer;
}
