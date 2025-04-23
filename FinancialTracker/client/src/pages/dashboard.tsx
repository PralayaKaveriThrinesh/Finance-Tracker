import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Sidebar from "@/components/dashboard/sidebar";
import StatsCard from "@/components/dashboard/stats-card";
import SpendingInsights from "@/components/dashboard/spending-insights";
import RecentTransactions from "@/components/dashboard/recent-transactions";
import NotificationsPanel from "@/components/dashboard/notifications-panel";
import BudgetProgress from "@/components/dashboard/budget-progress";
import FinancialGoals from "@/components/dashboard/financial-goals";
import IncomeManagement from "@/components/dashboard/income-management";
import CategoryManagement from "@/components/dashboard/category-management";
import BackupRestorePanel from "@/components/dashboard/backup-restore";
import ReportsExport from "@/components/dashboard/reports-export";
import MobileSidebar from "@/components/dashboard/mobile-sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Search, Bell, HelpCircle } from "lucide-react";
import { useLocation } from "wouter";
import type { Transaction, Budget, Goal, Notification, User, CategorySummary, Income, Category } from "@shared/schema";

export default function Dashboard() {
  const [location, navigate] = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user data
  const { data: user, isLoading: isUserLoading } = useQuery<User>({
    queryKey: ["/api/me"],
  });

  // Fetch transactions
  const { data: transactions = [], isLoading: isTransactionsLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  // Fetch notifications
  const { data: notifications = [], isLoading: isNotificationsLoading } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
  });

  // Fetch budgets
  const { data: budgets = [], isLoading: isBudgetsLoading } = useQuery<Budget[]>({
    queryKey: ["/api/budgets"],
  });

  // Fetch goals
  const { data: goals = [], isLoading: isGoalsLoading } = useQuery<Goal[]>({
    queryKey: ["/api/goals"],
  });

  // Fetch spending insights
  const { data: spendingInsights = [], isLoading: isInsightsLoading } = useQuery<CategorySummary[]>({
    queryKey: ["/api/insights/spending"],
  });
  
  // Fetch incomes
  const { data: incomes = [], isLoading: isIncomesLoading } = useQuery<Income[]>({
    queryKey: ["/api/incomes"],
  });
  
  // Fetch categories
  const { data: categories = [], isLoading: isCategoriesLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  // Check for authentication
  useEffect(() => {
    if (!isUserLoading && !user) {
      navigate("/login");
    }
  }, [user, isUserLoading, navigate]);

  // Calculate stats
  const totalBalance = transactions.reduce((sum, transaction) => {
    if (transaction.type === "income") {
      return sum + transaction.amount;
    } else {
      return sum - transaction.amount;
    }
  }, 0);

  const income = transactions
    .filter(tx => tx.type === "income")
    .reduce((sum, tx) => sum + tx.amount, 0);

  const expenses = transactions
    .filter(tx => tx.type === "expense")
    .reduce((sum, tx) => sum + tx.amount, 0);
    
  const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0;

  // If still loading or not authenticated
  if (isUserLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex">
      {/* Desktop Sidebar */}
      <Sidebar user={user} />
      
      {/* Mobile Sidebar */}
      <MobileSidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        user={user}
      />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top navigation */}
        <header className="bg-white shadow-sm">
          <div className="flex items-center justify-between p-4">
            {/* Mobile menu button */}
            <button 
              className="lg:hidden text-gray-600 focus:outline-none"
              onClick={() => setIsSidebarOpen(true)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            
            {/* Search bar */}
            <div className="hidden md:flex flex-1 max-w-lg mx-4">
              <div className="relative w-full">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <Input 
                  type="text" 
                  className="pl-10 pr-3 py-2 border border-gray-200 rounded-lg bg-gray-50"
                  placeholder="Search transactions..."
                />
              </div>
            </div>
            
            {/* Right navigation */}
            <div className="flex items-center space-x-4">
              <button className="relative text-gray-600 hover:text-gray-800">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 bg-destructive text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                  {notifications.filter(n => !n.read).length}
                </span>
              </button>
              <button className="text-gray-600 hover:text-gray-800">
                <HelpCircle className="h-5 w-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50">
          {/* Page heading */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Financial Dashboard</h1>
              <p className="text-gray-600">Overview of your financial health and recent activity</p>
            </div>
            <div className="mt-4 md:mt-0 flex space-x-3">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.open('/api/reports/download', '_blank')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export CSV
              </Button>
              <Button size="sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Transaction
              </Button>
            </div>
          </div>
          
          {/* Stats cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatsCard 
              title="Total Balance"
              value={totalBalance}
              changePercentage={8.2}
              changeDirection="up"
              icon="wallet"
              isLoading={isTransactionsLoading}
            />
            <StatsCard 
              title="Monthly Income"
              value={income}
              changePercentage={4.3}
              changeDirection="up"
              icon="income"
              isLoading={isTransactionsLoading}
            />
            <StatsCard 
              title="Monthly Expenses"
              value={expenses}
              changePercentage={12.5}
              changeDirection="up"
              changeIsGood={false}
              icon="expense"
              isLoading={isTransactionsLoading}
            />
            <StatsCard 
              title="Savings Rate"
              value={savingsRate}
              format="percentage"
              changePercentage={3.1}
              changeDirection="up"
              icon="savings"
              isLoading={isTransactionsLoading}
            />
          </div>
          
          {/* Main content grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left column - 2 cols wide */}
            <div className="lg:col-span-2 space-y-6">
              <SpendingInsights 
                data={spendingInsights}
                isLoading={isInsightsLoading}
              />
              <RecentTransactions 
                transactions={transactions}
                isLoading={isTransactionsLoading}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <IncomeManagement 
                  isLoading={isIncomesLoading}
                />
                <CategoryManagement 
                  isLoading={isCategoriesLoading}
                />
              </div>
              <ReportsExport 
                isLoading={isTransactionsLoading}
              />
            </div>
            
            {/* Right column - 1 col wide */}
            <div className="space-y-6">
              <NotificationsPanel 
                notifications={notifications}
                isLoading={isNotificationsLoading}
              />
              <BudgetProgress 
                budgets={budgets}
                transactions={transactions}
                isLoading={isBudgetsLoading || isTransactionsLoading}
              />
              <FinancialGoals 
                goals={goals}
                isLoading={isGoalsLoading}
              />
              <BackupRestorePanel />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
