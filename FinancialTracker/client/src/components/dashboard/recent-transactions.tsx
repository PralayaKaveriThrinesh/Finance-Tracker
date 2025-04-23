import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import CategoryIcon from "./category-icon";
import type { Transaction } from "@shared/schema";

interface RecentTransactionsProps {
  transactions: Transaction[];
  isLoading?: boolean;
  limit?: number;
}

export default function RecentTransactions({ 
  transactions, 
  isLoading = false,
  limit = 5 
}: RecentTransactionsProps) {
  // Get most recent transactions
  const recentTransactions = transactions
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, limit);

  if (isLoading) {
    return (
      <Card className="bg-white rounded-xl shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-16" />
          </div>
          
          <div className="space-y-4">
            {Array(5).fill(0).map((_, index) => (
              <div key={index} className="flex items-center p-3">
                <Skeleton className="mr-4 h-10 w-10 rounded-lg" />
                <div className="flex-1 min-w-0 space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <div className="text-right space-y-1">
                  <Skeleton className="h-4 w-16 ml-auto" />
                  <Skeleton className="h-3 w-20 ml-auto" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white rounded-xl shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-800">Recent Transactions</h2>
          <a href="/transactions" className="text-primary text-sm font-medium hover:text-primary-600">View All</a>
        </div>
        
        <div className="space-y-4">
          {recentTransactions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No transactions yet</p>
              <p className="text-sm text-gray-400 mt-1">Start by adding your first transaction</p>
            </div>
          ) : (
            recentTransactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center p-3 hover:bg-gray-50 rounded-lg transition-colors">
                <div className="mr-4 flex-shrink-0">
                  <CategoryIcon category={transaction.category} type={transaction.type} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">{transaction.description}</p>
                  <p className="text-xs text-gray-500">{formatDateTime(transaction.date)}</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-medium ${transaction.type === 'income' ? 'text-success' : 'text-gray-800'}`}>
                    {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                  </p>
                  <p className="text-xs text-gray-500">{transaction.category}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
