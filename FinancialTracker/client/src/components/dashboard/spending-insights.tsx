import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import type { CategorySummary } from "@shared/schema";

interface SpendingInsightsProps {
  data: CategorySummary[];
  isLoading?: boolean;
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#dc2626', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6'];

export default function SpendingInsights({ data, isLoading = false }: SpendingInsightsProps) {
  const [period, setPeriod] = useState("month");

  // Custom tooltip for pie chart
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-2 border border-gray-200 rounded-md shadow-sm">
          <p className="font-medium">{data.category}</p>
          <p className="text-sm">{formatCurrency(data.value)}</p>
          <p className="text-xs text-gray-500">{data.percentage}% of total</p>
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <Card className="bg-white rounded-xl shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-9 w-32" />
          </div>
          
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex justify-center mb-6 md:mb-0">
              <Skeleton className="h-52 w-52 rounded-full" />
            </div>
            
            <div className="w-full md:w-auto space-y-4">
              <Skeleton className="h-5 w-40" />
              
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <Skeleton className="h-2 w-full" />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white rounded-xl shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-800">Spending Insights</h2>
          <div className="flex items-center space-x-2">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white h-auto w-[140px]">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="lastMonth">Last Month</SelectItem>
                <SelectItem value="quarter">Last 3 Months</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row items-center justify-between">
          {/* Chart visualization */}
          <div className="flex justify-center mb-6 md:mb-0">
            <ResponsiveContainer width={220} height={220}>
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="category"
                  label={false}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          {/* Legend */}
          <div className="w-full md:w-auto">
            <h4 className="text-sm font-semibold text-gray-700 mb-4">Top Spending Categories</h4>
            
            {data.slice(0, 4).map((category, index) => (
              <div key={index} className="mb-3">
                <div className="flex justify-between">
                  <div className="flex items-center">
                    <div 
                      className="w-3 h-3 rounded-sm mr-2" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm text-gray-700">{category.category}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {formatCurrency(category.value)}
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
                  <div 
                    className="h-1.5 rounded-full" 
                    style={{ 
                      width: `${category.percentage}%`,
                      backgroundColor: COLORS[index % COLORS.length]
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
