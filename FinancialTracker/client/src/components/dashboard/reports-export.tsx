import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import type { SpendingReport, CategorySummary } from "@shared/schema";

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#dc2626', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6'];

interface ReportsExportProps {
  isLoading?: boolean;
}

export default function ReportsExport({ isLoading = false }: ReportsExportProps) {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Query for fetching spending report
  const { data: report } = useQuery<SpendingReport>({
    queryKey: ["/api/reports/spending"],
    enabled: !isLoading
  });
  
  // Query for fetching category insights
  const { data: categoryInsights = [] } = useQuery<CategorySummary[]>({
    queryKey: ["/api/insights/spending"],
    enabled: !isLoading
  });
  
  // Format report data for charts
  const chartData = report ? Object.entries(report.byCategory).map(([category, value]) => ({
    category,
    value,
    percentage: Math.round((value / report.total) * 100)
  })).sort((a, b) => b.value - a.value) : [];
  
  // Prepare download links
  const downloadCSV = () => {
    window.open('/api/reports/download', '_blank');
  };
  
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
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-6 w-40" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <Skeleton className="h-5 w-64" />
            <Skeleton className="h-10 w-28" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="bg-white rounded-xl shadow-sm">
      <CardHeader>
        <CardTitle>Reports & Analytics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center mb-6">
          <p className="text-sm text-gray-500">
            View spending reports and download financial data
          </p>
          <Button 
            onClick={downloadCSV}
            variant="outline"
            className="hover:bg-primary hover:text-white transition-colors"
          >
            <i className="ri-download-2-line mr-1"></i> Export Data (CSV)
          </Button>
        </div>
        
        {report && chartData.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Bar Chart */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-base font-semibold text-gray-800 mb-4">Top Expense Categories</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData.slice(0, 5)}>
                  <XAxis dataKey="category" />
                  <YAxis tickFormatter={(value) => `$${value}`} />
                  <Tooltip formatter={(value: any) => [`$${value}`, 'Amount']} />
                  <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            {/* Pie Chart */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-base font-semibold text-gray-800 mb-4">Spending Distribution</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={chartData}
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
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <div className="text-center py-10 bg-gray-50 rounded-lg">
            <i className="ri-bar-chart-box-line text-4xl text-gray-400"></i>
            <p className="text-gray-500 mt-2">No spending data available</p>
            <p className="text-sm text-gray-400">Add transactions to generate reports</p>
          </div>
        )}
        
        {report && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-semibold text-gray-800">Spending Summary</h3>
              <Button variant="ghost" onClick={() => setIsDialogOpen(true)}>View Detailed Report</Button>
            </div>
            
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-3 rounded-md shadow-sm">
                <p className="text-sm text-gray-500">Total Spend</p>
                <p className="text-xl font-bold text-gray-800">{formatCurrency(report.total)}</p>
              </div>
              
              <div className="bg-white p-3 rounded-md shadow-sm">
                <p className="text-sm text-gray-500">Categories</p>
                <p className="text-xl font-bold text-gray-800">{Object.keys(report.byCategory).length}</p>
              </div>
              
              <div className="bg-white p-3 rounded-md shadow-sm">
                <p className="text-sm text-gray-500">Highest Category</p>
                <p className="text-xl font-bold text-gray-800">
                  {chartData.length > 0 ? chartData[0].category : 'N/A'}
                </p>
              </div>
              
              <div className="bg-white p-3 rounded-md shadow-sm">
                <p className="text-sm text-gray-500">Highest Amount</p>
                <p className="text-xl font-bold text-gray-800">
                  {chartData.length > 0 ? formatCurrency(chartData[0].value) : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
      
      {/* Detailed Report Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detailed Spending Report</DialogTitle>
          </DialogHeader>
          
          {report && (
            <div className="max-h-[60vh] overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="text-left p-2">Category</th>
                    <th className="text-right p-2">Amount</th>
                    <th className="text-right p-2">Percentage</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {chartData.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="p-2">
                        <div className="flex items-center">
                          <div 
                            className="w-3 h-3 rounded-sm mr-2" 
                            style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                          />
                          {item.category}
                        </div>
                      </td>
                      <td className="text-right p-2">{formatCurrency(item.value)}</td>
                      <td className="text-right p-2">{item.percentage}%</td>
                    </tr>
                  ))}
                  <tr className="font-bold bg-gray-50">
                    <td className="p-2">Total</td>
                    <td className="text-right p-2">{formatCurrency(report.total)}</td>
                    <td className="text-right p-2">100%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
          
          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
            >
              Close
            </Button>
            <Button onClick={downloadCSV}>
              <i className="ri-download-2-line mr-1"></i> Export as CSV
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}