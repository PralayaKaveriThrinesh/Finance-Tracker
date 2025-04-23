import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import type { Category } from "@shared/schema";

// Define form schema for category
const categoryFormSchema = z.object({
  name: z.string().min(1, "Category name is required"),
  type: z.enum(["expense", "income"])
});

type CategoryFormValues = z.infer<typeof categoryFormSchema>;

interface CategoryManagementProps {
  isLoading?: boolean;
}

export default function CategoryManagement({ isLoading = false }: CategoryManagementProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  
  // Query for fetching categories
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    enabled: !isLoading
  });
  
  // Group categories by type
  const expenseCategories = categories.filter(cat => cat.type === "expense");
  const incomeCategories = categories.filter(cat => cat.type === "income");
  
  // Form setup
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: "",
      type: "expense"
    }
  });
  
  // Mutation for creating categories
  const createCategoryMutation = useMutation({
    mutationFn: async (data: CategoryFormValues) => {
      const response = await apiRequest("POST", "/api/categories", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({
        title: "Category added",
        description: "Your new category has been added successfully"
      });
      form.reset();
      setIsAddDialogOpen(false);
    },
    onError: (error: any) => {
      console.error("Error adding category:", error);
      const errorMessage = error.message || "There was an error adding your category";
      toast({
        title: "Failed to add category",
        description: errorMessage,
        variant: "destructive"
      });
    }
  });
  
  // Form submission handler
  const onSubmit = (data: CategoryFormValues) => {
    createCategoryMutation.mutate(data);
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
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-28" />
          </div>
          
          <div className="space-y-6">
            <div>
              <Skeleton className="h-5 w-32 mb-3" />
              <div className="flex flex-wrap gap-2">
                {Array(5).fill(0).map((_, index) => (
                  <Skeleton key={index} className="h-8 w-24 rounded-full" />
                ))}
              </div>
            </div>
            
            <div>
              <Skeleton className="h-5 w-32 mb-3" />
              <div className="flex flex-wrap gap-2">
                {Array(3).fill(0).map((_, index) => (
                  <Skeleton key={index} className="h-8 w-24 rounded-full" />
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="bg-white rounded-xl shadow-sm">
      <CardHeader>
        <CardTitle>Categories</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center mb-6">
          <p className="text-sm text-gray-500">Organize your finances with custom categories</p>
          <Button 
            onClick={() => setIsAddDialogOpen(true)}
            variant="outline"
            className="hover:bg-primary hover:text-white transition-colors"
          >
            <i className="ri-add-line mr-1"></i> Add Category
          </Button>
        </div>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-base font-semibold text-gray-800 mb-3">Expense Categories</h3>
            <div className="flex flex-wrap gap-2">
              {expenseCategories.length === 0 ? (
                <p className="text-sm text-gray-500">No expense categories defined</p>
              ) : (
                expenseCategories.map((category) => (
                  <Badge key={category.id} variant="outline" className="py-1.5 px-3 bg-red-50 border-red-200 text-red-700">
                    {category.name}
                  </Badge>
                ))
              )}
            </div>
          </div>
          
          <div>
            <h3 className="text-base font-semibold text-gray-800 mb-3">Income Categories</h3>
            <div className="flex flex-wrap gap-2">
              {incomeCategories.length === 0 ? (
                <p className="text-sm text-gray-500">No income categories defined</p>
              ) : (
                incomeCategories.map((category) => (
                  <Badge key={category.id} variant="outline" className="py-1.5 px-3 bg-green-50 border-green-200 text-green-700">
                    {category.name}
                  </Badge>
                ))
              )}
            </div>
          </div>
        </div>
      </CardContent>
      
      {/* Add Category Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Category</DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Food, Transport, Salary, etc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category Type</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="expense">Expense</SelectItem>
                        <SelectItem value="income">Income</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter className="mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={createCategoryMutation.isPending}
                >
                  {createCategoryMutation.isPending ? "Adding..." : "Add Category"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}