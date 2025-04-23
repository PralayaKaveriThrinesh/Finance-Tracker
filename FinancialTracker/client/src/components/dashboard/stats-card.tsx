import { cn, formatCurrency, formatPercentage } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface StatsCardProps {
  title: string;
  value: number;
  changePercentage?: number;
  changeDirection?: "up" | "down" | "neutral";
  changeIsGood?: boolean;
  icon: "wallet" | "income" | "expense" | "savings";
  format?: "currency" | "percentage";
  isLoading?: boolean;
}

export default function StatsCard({
  title,
  value,
  changePercentage,
  changeDirection = "neutral",
  changeIsGood = true,
  icon,
  format = "currency",
  isLoading = false,
}: StatsCardProps) {
  // Icon mapping
  const iconMap = {
    wallet: "ri-wallet-3-line",
    income: "ri-funds-line",
    expense: "ri-shopping-bag-line",
    savings: "ri-bank-line",
  };

  // Background color mapping
  const bgColorMap = {
    wallet: "bg-primary-50 text-primary",
    income: "bg-green-50 text-success",
    expense: "bg-red-50 text-danger",
    savings: "bg-blue-50 text-primary",
  };

  // Format value based on format type
  const formattedValue = format === "currency" 
    ? formatCurrency(value) 
    : formatPercentage(value);

  // Determine change text color
  const changeColor = changeIsGood 
    ? (changeDirection === "up" ? "text-success" : "text-danger") 
    : (changeDirection === "up" ? "text-danger" : "text-success");

  if (isLoading) {
    return (
      <Card className="bg-white rounded-xl shadow-sm">
        <CardContent className="p-5">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-4 w-28" />
            </div>
            <Skeleton className="h-10 w-10 rounded-lg" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white rounded-xl shadow-sm">
      <CardContent className="p-5">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <h3 className="text-2xl font-bold text-gray-800 mt-1">{formattedValue}</h3>
            {changePercentage !== undefined && (
              <p className={cn("text-sm flex items-center mt-1", changeColor)}>
                <i className={`ri-arrow-${changeDirection}-line mr-1`}></i> 
                {changePercentage}% 
                <span className="text-gray-500 ml-1">vs last month</span>
              </p>
            )}
          </div>
          <div className={cn("rounded-lg p-2", bgColorMap[icon])}>
            <i className={cn(iconMap[icon], "text-xl")}></i>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
