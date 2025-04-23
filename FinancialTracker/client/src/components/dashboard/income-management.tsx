import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Income } from "@shared/schema";

// Define form schema for income
const incomeFormSchema = z.object({
  source: z.string().min(1, "Income source is required"),
  amount: z.coerce.number().positive("Amount must be positive"),
  date: z.coerce.date(),
  recurring: z.boolean().default(false)
});

type IncomeFormValues = z.infer<typeof incomeFormSchema>;

interface IncomeManagementProps {
  isLoading?: boolean;
}

export default function IncomeManagement({ isLoading = false }: IncomeManagementProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  
  // Query for fetching incomes
  const { data: incomes = [] } = useQuery<Income[]>({
    queryKey: ["/api/incomes"],
    enabled: !isLoading
  });
  
  // Sort incomes by date (newest first)
  const sortedIncomes = [...incomes].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  // Form setup
  const form = useForm<IncomeFormValues>({
    resolver: zodResolver(incomeFormSchema),
    defaultValues: {
      source: "",
      amount: 0,
      date: new Date(),
      recurring: false
    }
  });
  
  // Mutation for creating incomes
  const createIncomeMutation = useMutation({
    mutationFn: async (data: IncomeFormValues) => {
      const response = await apiRequest("POST", "/api/incomes", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/incomes"] });
      toast({
        title: "Income added",
        description: "Your income entry has been added successfully"
      });
      form.reset();
      setIsAddDialogOpen(false);
    },
    onError: (error) => {
      console.error("Error adding income:", error);
      toast({
        title: "Failed to add income",
        description: "There was an error adding your income entry",
        variant: "destructive"
      });
    }
  });
  
  // Form submission handler
  const onSubmit = (data: IncomeFormValues) => {
    createIncomeMutation.mutate(data);
  };
  
  const totalIncome = incomes.reduce((sum, income) => sum + income.amount, 0);
  
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
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-28" />
          </div>
          
          <div className="space-y-4">
            {Array(3).fill(0).map((_, index) => (
              <div key={index} className="flex items-center justify-between border-b pb-3">
                <div className="space-y-1">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-6 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="bg-white rounded-xl shadow-sm">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Income Management</span>
          <span className="text-success">{formatCurrency(totalIncome)}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center mb-4">
          <p className="text-sm text-gray-500">Track your income sources and recurring payments</p>
          <Button 
            onClick={() => setIsAddDialogOpen(true)}
            variant="outline"
            className="hover:bg-primary hover:text-white transition-colors"
          >
            <i className="ri-add-line mr-1"></i> Add Income
          </Button>
        </div>
        
        <div className="space-y-4">
          {sortedIncomes.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-gray-500">No income entries yet</p>
              <p className="text-sm text-gray-400 mt-1">Add your first income source</p>
            </div>
          ) : (
            sortedIncomes.map((income) => (
              <div 
                key={income.id} 
                className="flex items-center justify-between border-b pb-3 hover:bg-gray-50 p-2 rounded transition-colors"
              >
                <div>
                  <h4 className="font-medium text-gray-800">{income.source}</h4>
                  <div className="flex items-center text-gray-500 text-sm">
                    <span className="mr-2">{formatDate(income.date)}</span>
                    {income.recurring && (
                      <span className="inline-flex items-center text-green-600 text-xs bg-green-50 px-2 py-0.5 rounded-full">
                        <i className="ri-refresh-line mr-1"></i> Recurring
                      </span>
                    )}
                  </div>
                </div>
                <span className="font-semibold text-success">
                  {formatCurrency(income.amount)}
                </span>
              </div>
            ))
          )}
        </div>
      </CardContent>
      
      {/* Add Income Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Income</DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="source"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Income Source</FormLabel>
                    <FormControl>
                      <Input placeholder="Salary, Freelance, etc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="0.00" 
                        step="0.01" 
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        {...field} 
                        value={field.value instanceof Date 
                          ? field.value.toISOString().split('T')[0] 
                          : new Date().toISOString().split('T')[0]
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="recurring"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Recurring Income</FormLabel>
                      <FormDescription>
                        Mark if this is a recurring source of income
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={createIncomeMutation.isPending}
                >
                  {createIncomeMutation.isPending ? "Adding..." : "Add Income"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}