import { cn } from "@/lib/utils";

interface CategoryIconProps {
  category: string;
  type: string;
  className?: string;
}

export default function CategoryIcon({ category, type, className }: CategoryIconProps) {
  const getIconClass = () => {
    const lowerCategory = category.toLowerCase();
    
    // Transaction type specific icons
    if (type === 'income') {
      if (lowerCategory.includes('salary') || lowerCategory.includes('wage')) {
        return 'ri-bank-line';
      }
      if (lowerCategory.includes('refund')) {
        return 'ri-refund-line';
      }
      if (lowerCategory.includes('gift')) {
        return 'ri-gift-line';
      }
      return 'ri-funds-line';
    }
    
    // Expense category icons
    if (lowerCategory.includes('food') || lowerCategory.includes('grocery') || lowerCategory.includes('restaurant')) {
      return 'ri-restaurant-line';
    }
    if (lowerCategory.includes('transport') || lowerCategory.includes('travel') || lowerCategory.includes('car')) {
      return 'ri-car-line';
    }
    if (lowerCategory.includes('entertainment') || lowerCategory.includes('movie') || lowerCategory.includes('concert')) {
      return 'ri-movie-line';
    }
    if (lowerCategory.includes('shopping') || lowerCategory.includes('clothes')) {
      return 'ri-shopping-bag-line';
    }
    if (lowerCategory.includes('bill') || lowerCategory.includes('utility')) {
      return 'ri-bill-line';
    }
    if (lowerCategory.includes('health') || lowerCategory.includes('medical')) {
      return 'ri-heart-pulse-line';
    }
    if (lowerCategory.includes('education') || lowerCategory.includes('school')) {
      return 'ri-book-open-line';
    }
    
    // Default icon
    return 'ri-exchange-dollar-line';
  };
  
  const getBackgroundColorClass = () => {
    const lowerCategory = category.toLowerCase();
    
    if (type === 'income') {
      return 'bg-green-50 text-success';
    }
    
    if (lowerCategory.includes('food') || lowerCategory.includes('grocery') || lowerCategory.includes('restaurant')) {
      return 'bg-primary-50 text-primary';
    }
    if (lowerCategory.includes('transport') || lowerCategory.includes('travel')) {
      return 'bg-blue-50 text-blue-500';
    }
    if (lowerCategory.includes('entertainment') || lowerCategory.includes('movie')) {
      return 'bg-amber-50 text-amber-500';
    }
    if (lowerCategory.includes('shopping')) {
      return 'bg-red-50 text-danger';
    }
    
    // Default background
    return 'bg-gray-50 text-gray-500';
  };

  return (
    <div className={cn(
      "w-10 h-10 rounded-lg flex items-center justify-center",
      getBackgroundColorClass(),
      className
    )}>
      <i className={getIconClass()}></i>
    </div>
  );
}
