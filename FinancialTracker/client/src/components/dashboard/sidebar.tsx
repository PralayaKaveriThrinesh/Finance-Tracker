import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import type { User } from "@shared/schema";

interface SidebarProps {
  user: User;
}

export default function Sidebar({ user }: SidebarProps) {
  const [location] = useLocation();

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: "ri-dashboard-line" },
    { name: "Transactions", href: "/transactions", icon: "ri-exchange-dollar-line" },
    { name: "Analytics", href: "/analytics", icon: "ri-pie-chart-line" },
    { name: "Accounts", href: "/accounts", icon: "ri-bank-card-line" },
    { name: "Settings", href: "/settings", icon: "ri-settings-3-line" },
  ];

  return (
    <div className="hidden lg:flex lg:flex-col lg:w-64 bg-white shadow-lg">
      <div className="p-4 flex items-center space-x-2">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white">
          <i className="ri-line-chart-line text-xl"></i>
        </div>
        <span className="text-xl font-bold text-gray-800">FinTrack</span>
      </div>
      
      <nav className="flex-1 px-2 py-4 space-y-1">
        {navigation.map((item) => {
          const isActive = location === item.href;
          return (
            <Link 
              key={item.name} 
              href={item.href}
              className={cn(
                "flex items-center px-4 py-2 rounded-lg",
                isActive 
                  ? "text-gray-800 bg-gray-100" 
                  : "text-gray-700 hover:bg-gray-100"
              )}
            >
              <i className={cn(item.icon, "mr-3", isActive ? "text-primary" : "text-gray-500")}></i>
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
      
      <div className="p-4 border-t">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600">
            <i className="ri-user-line"></i>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-700">{user.name}</p>
            <p className="text-xs text-gray-500">{user.email}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
