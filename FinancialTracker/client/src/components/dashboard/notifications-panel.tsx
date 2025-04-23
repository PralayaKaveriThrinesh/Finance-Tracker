import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { getRelativeTime } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useQueryClient } from "@tanstack/react-query";
import type { Notification } from "@shared/schema";

interface NotificationsPanelProps {
  notifications: Notification[];
  isLoading?: boolean;
}

export default function NotificationsPanel({ 
  notifications, 
  isLoading = false 
}: NotificationsPanelProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleMarkAsRead = async (id: number) => {
    try {
      await apiRequest("POST", `/api/notifications/${id}/read`);
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      toast({
        title: "Error",
        description: "Failed to mark notification as read",
        variant: "destructive",
      });
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.read);
      await Promise.all(
        unreadNotifications.map(n => apiRequest("POST", `/api/notifications/${n.id}/read`))
      );
      
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      
      toast({
        title: "Success",
        description: "All notifications marked as read",
      });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      toast({
        title: "Error",
        description: "Failed to mark all notifications as read",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-white rounded-xl shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-28" />
          </div>
          
          <div className="space-y-3">
            {Array(3).fill(0).map((_, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-start">
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <Skeleton className="h-5 w-5 rounded-full" />
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
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800">Notifications</h2>
          {notifications.some(n => !n.read) && (
            <button
              className="text-sm text-primary hover:text-primary-600 font-medium"
              onClick={handleMarkAllAsRead}
            >
              Mark all as read
            </button>
          )}
        </div>
        
        <div className="space-y-3">
          {notifications.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-gray-500">No notifications</p>
              <p className="text-sm text-gray-400 mt-1">You're all caught up!</p>
            </div>
          ) : (
            notifications.slice(0, 3).map((notification) => (
              <div 
                key={notification.id} 
                className={`p-3 rounded-r-lg ${notification.read 
                  ? 'bg-gray-50 border-l-4 border-gray-300' 
                  : 'bg-primary-50 border-l-4 border-primary'
                }`}
              >
                <div className="flex items-start">
                  <div className="flex-1">
                    <p className={`text-sm ${notification.read ? 'text-gray-600' : 'text-gray-800'}`}>
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {getRelativeTime(notification.createdAt)}
                    </p>
                  </div>
                  {!notification.read && (
                    <button 
                      className="text-gray-400 hover:text-gray-500"
                      onClick={() => handleMarkAsRead(notification.id)}
                    >
                      <i className="ri-close-line"></i>
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
        
        {notifications.length > 3 && (
          <div className="mt-4 text-center">
            <button className="text-sm text-gray-600 hover:text-gray-800">
              View all notifications
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
