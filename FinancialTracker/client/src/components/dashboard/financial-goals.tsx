import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Goal } from "@shared/schema";

interface FinancialGoalsProps {
  goals: Goal[];
  isLoading?: boolean;
}

export default function FinancialGoals({ goals, isLoading = false }: FinancialGoalsProps) {
  // Get goal progress percentage
  const getGoalProgress = (current: number, target: number) => {
    return (current / target) * 100;
  };

  const getDeadlineText = (deadline: Date | string | null) => {
    if (!deadline) return '';
    return `by ${formatDate(deadline)}`;
  };

  if (isLoading) {
    return (
      <Card className="bg-white rounded-xl shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-16" />
          </div>
          
          <div className="space-y-6">
            {Array(2).fill(0).map((_, index) => (
              <div key={index} className="relative">
                <div className="flex items-center mb-2">
                  <Skeleton className="w-9 h-9 rounded-lg mr-3" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <div className="flex justify-between">
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-3 w-28" />
                    </div>
                  </div>
                </div>
                <Skeleton className="h-1.5 w-full rounded-full" />
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
          <h2 className="text-lg font-bold text-gray-800">Financial Goals</h2>
          <button className="text-sm text-primary hover:text-primary-600 font-medium">Manage</button>
        </div>
        
        <div className="space-y-6">
          {goals.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-gray-500">No goals set</p>
              <p className="text-sm text-gray-400 mt-1">Create a goal to start saving</p>
            </div>
          ) : (
            goals.map((goal) => {
              const progress = getGoalProgress(goal.currentAmount, goal.targetAmount);
              
              return (
                <div key={goal.id} className="relative">
                  <div className="flex items-center mb-2">
                    <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-primary mr-3">
                      <i className="ri-home-4-line"></i>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-800">{goal.name}</h3>
                      <div className="flex justify-between mt-0.5">
                        <span className="text-xs text-gray-500">
                          {getDeadlineText(goal.deadline)}
                        </span>
                        <span className="text-xs font-medium text-gray-700">
                          <span>{formatCurrency(goal.currentAmount)}</span> 
                          <span className="text-gray-500"> of </span> 
                          <span>{formatCurrency(goal.targetAmount)}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div 
                      className="bg-primary h-1.5 rounded-full" 
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
              );
            })
          )}
        </div>
        
        <div className="mt-6">
          <button className="w-full py-2 bg-gray-100 text-sm text-gray-700 rounded-lg hover:bg-gray-200">
            <i className="ri-add-line mr-1"></i> Add new goal
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
