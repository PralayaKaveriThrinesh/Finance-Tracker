import { 
  users, type User, type InsertUser,
  notifications, type Notification, type InsertNotification,
  transactions, type Transaction, type InsertTransaction,
  budgets, type Budget, type InsertBudget,
  goals, type Goal, type InsertGoal,
  categories, type Category, type InsertCategory,
  incomes, type Income, type InsertIncome,
  type CategorySummary,
  type SpendingReport
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Notification operations
  getNotifications(userId: number): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<Notification | undefined>;
  markAllNotificationsAsRead(userId: number): Promise<void>;
  
  // Transaction operations
  getTransactions(userId: number): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getTransactionById(id: number): Promise<Transaction | undefined>;
  updateTransaction(id: number, transaction: Partial<Transaction>): Promise<Transaction | undefined>;
  deleteTransaction(id: number): Promise<boolean>;
  
  // Category operations
  getCategories(userId: number): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  getCategoryByName(userId: number, name: string): Promise<Category | undefined>;
  
  // Income operations
  getIncomes(userId: number): Promise<Income[]>;
  createIncome(income: InsertIncome): Promise<Income>;
  updateIncome(id: number, income: Partial<Income>): Promise<Income | undefined>;
  deleteIncome(id: number): Promise<boolean>;
  
  // Budget operations
  getBudgets(userId: number): Promise<Budget[]>;
  createBudget(budget: InsertBudget): Promise<Budget>;
  updateBudget(id: number, budget: Partial<Budget>): Promise<Budget | undefined>;
  deleteBudget(id: number): Promise<boolean>;
  
  // Goal operations
  getGoals(userId: number): Promise<Goal[]>;
  createGoal(goal: InsertGoal): Promise<Goal>;
  updateGoal(id: number, goal: Partial<Goal>): Promise<Goal | undefined>;
  deleteGoal(id: number): Promise<boolean>;
  
  // Analytics
  getSpendingByCategory(userId: number): Promise<CategorySummary[]>;
  getSpendingReport(userId: number): Promise<SpendingReport>;
  
  // Backup & Restore
  createBackup(userId: number): Promise<any>;
  restoreBackup(userId: number, data: any): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private notifications: Map<number, Notification>;
  private transactions: Map<number, Transaction>;
  private categories: Map<number, Category>;
  private incomes: Map<number, Income>;
  private budgets: Map<number, Budget>;
  private goals: Map<number, Goal>;
  
  private currentUserId: number;
  private currentNotificationId: number;
  private currentTransactionId: number;
  private currentCategoryId: number;
  private currentIncomeId: number;
  private currentBudgetId: number;
  private currentGoalId: number;

  constructor() {
    this.users = new Map();
    this.notifications = new Map();
    this.transactions = new Map();
    this.categories = new Map();
    this.incomes = new Map();
    this.budgets = new Map();
    this.goals = new Map();
    
    this.currentUserId = 1;
    this.currentNotificationId = 1;
    this.currentTransactionId = 1;
    this.currentCategoryId = 1;
    this.currentIncomeId = 1;
    this.currentBudgetId = 1;
    this.currentGoalId = 1;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const now = new Date();
    const user: User = { ...insertUser, id, createdAt: now };
    this.users.set(id, user);
    return user;
  }

  // Notification methods
  async getNotifications(userId: number): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter(notification => notification.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const id = this.currentNotificationId++;
    const now = new Date();
    const notification: Notification = { 
      ...insertNotification, 
      id, 
      createdAt: now,
      read: insertNotification.read || false
    };
    this.notifications.set(id, notification);
    return notification;
  }

  async markNotificationAsRead(id: number): Promise<Notification | undefined> {
    const notification = this.notifications.get(id);
    if (!notification) return undefined;
    
    const updatedNotification = { ...notification, read: true };
    this.notifications.set(id, updatedNotification);
    return updatedNotification;
  }
  
  async markAllNotificationsAsRead(userId: number): Promise<void> {
    const userNotifications = await this.getNotifications(userId);
    
    for (const notification of userNotifications) {
      if (!notification.read) {
        this.notifications.set(notification.id, { ...notification, read: true });
      }
    }
  }

  // Transaction methods
  async getTransactions(userId: number): Promise<Transaction[]> {
    return Array.from(this.transactions.values())
      .filter(transaction => transaction.userId === userId)
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const id = this.currentTransactionId++;
    const transaction: Transaction = { 
      ...insertTransaction, 
      id,
      date: insertTransaction.date || new Date(),
      recurring: insertTransaction.recurring || false,
      note: insertTransaction.note || null
    };
    this.transactions.set(id, transaction);
    return transaction;
  }

  async getTransactionById(id: number): Promise<Transaction | undefined> {
    return this.transactions.get(id);
  }
  
  async updateTransaction(id: number, transactionUpdate: Partial<Transaction>): Promise<Transaction | undefined> {
    const transaction = this.transactions.get(id);
    if (!transaction) return undefined;
    
    const updatedTransaction = { ...transaction, ...transactionUpdate };
    this.transactions.set(id, updatedTransaction);
    return updatedTransaction;
  }
  
  async deleteTransaction(id: number): Promise<boolean> {
    return this.transactions.delete(id);
  }
  
  // Category methods
  async getCategories(userId: number): Promise<Category[]> {
    return Array.from(this.categories.values())
      .filter(category => category.userId === userId);
  }
  
  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const id = this.currentCategoryId++;
    const now = new Date();
    const category: Category = { 
      ...insertCategory, 
      id, 
      createdAt: now,
      type: insertCategory.type || 'expense'
    };
    this.categories.set(id, category);
    return category;
  }
  
  async getCategoryByName(userId: number, name: string): Promise<Category | undefined> {
    return Array.from(this.categories.values())
      .find(category => category.userId === userId && category.name.toLowerCase() === name.toLowerCase());
  }
  
  // Income methods
  async getIncomes(userId: number): Promise<Income[]> {
    return Array.from(this.incomes.values())
      .filter(income => income.userId === userId)
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }
  
  async createIncome(insertIncome: InsertIncome): Promise<Income> {
    const id = this.currentIncomeId++;
    const income: Income = { 
      ...insertIncome, 
      id,
      date: insertIncome.date || new Date(),
      recurring: insertIncome.recurring || false
    };
    this.incomes.set(id, income);
    return income;
  }
  
  async updateIncome(id: number, incomeUpdate: Partial<Income>): Promise<Income | undefined> {
    const income = this.incomes.get(id);
    if (!income) return undefined;
    
    const updatedIncome = { ...income, ...incomeUpdate };
    this.incomes.set(id, updatedIncome);
    return updatedIncome;
  }
  
  async deleteIncome(id: number): Promise<boolean> {
    return this.incomes.delete(id);
  }

  // Budget methods
  async getBudgets(userId: number): Promise<Budget[]> {
    return Array.from(this.budgets.values())
      .filter(budget => budget.userId === userId);
  }

  async createBudget(insertBudget: InsertBudget): Promise<Budget> {
    const id = this.currentBudgetId++;
    const budget: Budget = { ...insertBudget, id };
    this.budgets.set(id, budget);
    return budget;
  }

  async updateBudget(id: number, budgetUpdate: Partial<Budget>): Promise<Budget | undefined> {
    const budget = this.budgets.get(id);
    if (!budget) return undefined;
    
    const updatedBudget = { ...budget, ...budgetUpdate };
    this.budgets.set(id, updatedBudget);
    return updatedBudget;
  }
  
  async deleteBudget(id: number): Promise<boolean> {
    return this.budgets.delete(id);
  }

  // Goal methods
  async getGoals(userId: number): Promise<Goal[]> {
    return Array.from(this.goals.values())
      .filter(goal => goal.userId === userId);
  }

  async createGoal(insertGoal: InsertGoal): Promise<Goal> {
    const id = this.currentGoalId++;
    const goal: Goal = { 
      ...insertGoal, 
      id,
      currentAmount: insertGoal.currentAmount || 0,
      deadline: insertGoal.deadline || null
    };
    this.goals.set(id, goal);
    return goal;
  }

  async updateGoal(id: number, goalUpdate: Partial<Goal>): Promise<Goal | undefined> {
    const goal = this.goals.get(id);
    if (!goal) return undefined;
    
    const updatedGoal = { ...goal, ...goalUpdate };
    this.goals.set(id, updatedGoal);
    return updatedGoal;
  }
  
  async deleteGoal(id: number): Promise<boolean> {
    return this.goals.delete(id);
  }

  // Analytics methods
  async getSpendingByCategory(userId: number): Promise<CategorySummary[]> {
    const transactions = await this.getTransactions(userId);
    const expenseTransactions = transactions.filter(t => t.type === "expense");
    
    const categoryMap = new Map<string, number>();
    let totalSpent = 0;
    
    expenseTransactions.forEach(transaction => {
      const { category, amount } = transaction;
      const currentAmount = categoryMap.get(category) || 0;
      categoryMap.set(category, currentAmount + amount);
      totalSpent += amount;
    });
    
    const result: CategorySummary[] = Array.from(categoryMap.entries()).map(([category, value]) => ({
      category,
      value,
      percentage: totalSpent > 0 ? Math.round((value / totalSpent) * 100) : 0
    }));
    
    return result.sort((a, b) => b.value - a.value);
  }
  
  async getSpendingReport(userId: number): Promise<SpendingReport> {
    const transactions = await this.getTransactions(userId);
    const expenseTransactions = transactions.filter(t => t.type === "expense");
    
    const report = expenseTransactions.reduce(
      (acc, expense) => {
        acc.total += expense.amount;
        acc.byCategory[expense.category] = (acc.byCategory[expense.category] || 0) + expense.amount;
        return acc;
      },
      { total: 0, byCategory: {} as Record<string, number> }
    );
    
    return report;
  }
  
  // Backup & Restore
  async createBackup(userId: number): Promise<any> {
    return {
      transactions: await this.getTransactions(userId),
      incomes: await this.getIncomes(userId),
      budgets: await this.getBudgets(userId),
      goals: await this.getGoals(userId),
      categories: await this.getCategories(userId),
    };
  }
  
  async restoreBackup(userId: number, data: any): Promise<void> {
    // Delete existing user data
    const userTransactions = await this.getTransactions(userId);
    const userIncomes = await this.getIncomes(userId);
    const userBudgets = await this.getBudgets(userId);
    const userGoals = await this.getGoals(userId);
    const userCategories = await this.getCategories(userId);
    
    // Remove existing data
    userTransactions.forEach(t => this.transactions.delete(t.id));
    userIncomes.forEach(i => this.incomes.delete(i.id));
    userBudgets.forEach(b => this.budgets.delete(b.id));
    userGoals.forEach(g => this.goals.delete(g.id));
    userCategories.forEach(c => this.categories.delete(c.id));
    
    // Restore from backup
    if (data.transactions && Array.isArray(data.transactions)) {
      for (const transaction of data.transactions) {
        await this.createTransaction({ ...transaction, userId });
      }
    }
    
    if (data.incomes && Array.isArray(data.incomes)) {
      for (const income of data.incomes) {
        await this.createIncome({ ...income, userId });
      }
    }
    
    if (data.budgets && Array.isArray(data.budgets)) {
      for (const budget of data.budgets) {
        await this.createBudget({ ...budget, userId });
      }
    }
    
    if (data.goals && Array.isArray(data.goals)) {
      for (const goal of data.goals) {
        await this.createGoal({ ...goal, userId });
      }
    }
    
    if (data.categories && Array.isArray(data.categories)) {
      for (const category of data.categories) {
        await this.createCategory({ ...category, userId });
      }
    }
  }
}

export const storage = new MemStorage();
