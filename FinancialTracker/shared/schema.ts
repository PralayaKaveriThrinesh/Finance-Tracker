import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  message: text("message").notNull(),
  read: boolean("read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  amount: doublePrecision("amount").notNull(),
  category: text("category").notNull(),
  description: text("description").notNull(),
  date: timestamp("date").defaultNow().notNull(),
  type: text("type").notNull(), // "income" or "expense"
  recurring: boolean("recurring").default(false),
  note: text("note"),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  type: text("type").default("expense"), // "income" or "expense"
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const incomes = pgTable("incomes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  source: text("source").notNull(),
  amount: doublePrecision("amount").notNull(),
  date: timestamp("date").defaultNow().notNull(),
  recurring: boolean("recurring").default(false),
});

export const budgets = pgTable("budgets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  category: text("category").notNull(),
  amount: doublePrecision("amount").notNull(),
  period: text("period").notNull(), // "monthly", "yearly", etc.
});

export const goals = pgTable("goals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  targetAmount: doublePrecision("target_amount").notNull(),
  currentAmount: doublePrecision("current_amount").default(0).notNull(),
  deadline: timestamp("deadline"),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true,
});

export const insertIncomeSchema = createInsertSchema(incomes).omit({
  id: true,
});

export const insertBudgetSchema = createInsertSchema(budgets).omit({
  id: true,
});

export const insertGoalSchema = createInsertSchema(goals).omit({
  id: true,
});

// Login schema
export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

// Report schema
export const reportSchema = z.object({
  userId: z.number(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  format: z.enum(["json", "csv"]).default("json"),
});

// Backup schema
export const backupSchema = z.object({
  userId: z.number(),
});

// Restore schema
export const restoreSchema = z.object({
  userId: z.number(),
  data: z.object({
    transactions: z.array(z.any()),
    incomes: z.array(z.any()),
    budgets: z.array(z.any()),
    goals: z.array(z.any()),
    categories: z.array(z.any()),
  }),
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginUser = z.infer<typeof loginSchema>;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export type Income = typeof incomes.$inferSelect;
export type InsertIncome = z.infer<typeof insertIncomeSchema>;

export type Budget = typeof budgets.$inferSelect;
export type InsertBudget = z.infer<typeof insertBudgetSchema>;

export type Goal = typeof goals.$inferSelect;
export type InsertGoal = z.infer<typeof insertGoalSchema>;

export type Report = z.infer<typeof reportSchema>;
export type Backup = z.infer<typeof backupSchema>;
export type Restore = z.infer<typeof restoreSchema>;

export type CategorySummary = {
  category: string;
  value: number;
  percentage?: number;
};

export type SpendingReport = {
  total: number;
  byCategory: Record<string, number>;
};
