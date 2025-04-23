import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import CategoryIcon from "./category-icon";
import type { Budget, Transaction } from "@shared/schema";

interface BudgetProgressProps {
  budgets: Budget[];
  transactions: Transaction[];
  isLoading?: boolean;
}

export default function BudgetProgress({ 
  budgets, 
  transactions,
  isLoading = false 
}: BudgetProgressProps) {
  
  // Calculate current spending for each budget
  const calculateBudgetSpending = (budget: Budget) => {
    const currentMonthStart = new Date();
    currentMonthStart.setDate(1);
    currentMonthStart.setHours(0, 0, 0, 0);
    
    const spent = transactions
      .filter(t => 
        t.type === 'expense' && 
        t.category === budget.category &&
        new Date(t.date) >= currentMonthStart
      )
      .reduce((sum, t) => sum + t.amount, 0);
      
    const percentage = (spent / budget.amount) * 100;
    
    return {
      spent,
      percentage,
      isExceeded: spent > budget.amount
    };
  };

  if (isLoading) {
    return (
      <Card className="bg-white rounded-xl shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-16" />
          </div>
          
          <div className="space-y-4">
            {Array(4).fill(0).map((_, index) => (
              <div key={index}>
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center">
                    <Skeleton className="h-5 w-5 mr-2 rounded" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
            ))}
          </div>
          
          <div className="mt-6">
            <Skeleton className="h-9 w-full rounded-lg" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white rounded-xl shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800">Budget Progress</h2>
          <button className="text-sm text-primary hover:text-primary-600 font-medium">Manage</button>
        </div>
        
        <div className="space-y-4">
          {budgets.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-gray-500">No budgets set</p>
              <p className="text-sm text-gray-400 mt-1">Create a budget to track your spending</p>
            </div>
          ) : (
            budgets.map((budget) => {
              const { spent, percentage, isExceeded } = calculateBudgetSpending(budget);
              
              return (
                <div key={budget.id}>
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center">
                      <CategoryIcon category={budget.category} type="expense" className="mr-2 w-5 h-5" />
                      <span className="text-sm font-medium text-gray-700">{budget.category}</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      <span className={`font-medium ${isExceeded ? 'text-warning' : 'text-gray-800'}`}>
                        {formatCurrency(spent)}
                      </span>
                      <span> / </span>
                      <span>{formatCurrency(budget.amount)}</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${isExceeded ? 'bg-warning' : 'bg-primary'}`} 
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    ></div>
                  </div>
                </div>
              );
            })
          )}
        </div>
        
        <div className="mt-6">
          <button className="w-full py-2 bg-gray-100 text-sm text-gray-700 rounded-lg hover:bg-gray-200">
            <i className="ri-add-line mr-1"></i> Add new budget
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
