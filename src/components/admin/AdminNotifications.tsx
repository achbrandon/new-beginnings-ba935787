import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

export function AdminNotifications() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const previousCountRef = useRef(0);

  useEffect(() => {
    // Create audio element
    audioRef.current = new Audio("/notification.mp3");
    audioRef.current.volume = 1.0;

    fetchNotifications();

    // Subscribe to new notifications
    const channel = supabase
      .channel('admin-notifications')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'admin_notifications' 
      }, (payload) => {
        fetchNotifications();
        playNotificationSound();
        toast.info("New notification received!");
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from("admin_notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;

      const unread = data?.filter(n => !n.is_read).length || 0;
      
      // Play sound if new notifications arrived
      if (data && data.length > previousCountRef.current) {
        playNotificationSound();
      }
      
      previousCountRef.current = data?.length || 0;
      setNotifications(data || []);
      setUnreadCount(unread);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const playNotificationSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(err => {
        console.log("Audio play failed:", err);
      });
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await supabase
        .from("admin_notifications")
        .update({ is_read: true })
        .eq("id", id);
      fetchNotifications();
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-600"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="p-2 font-semibold border-b">Notifications</div>
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground text-sm">
            No notifications
          </div>
        ) : (
          notifications.map((notification) => (
            <DropdownMenuItem
              key={notification.id}
              className="p-4 cursor-pointer"
              onClick={() => !notification.is_read && markAsRead(notification.id)}
            >
              <div className="space-y-1 w-full">
                <div className="flex items-center justify-between">
                  <p className={`text-sm ${!notification.is_read ? 'font-semibold' : ''}`}>
                    {notification.notification_type.replace('_', ' ').toUpperCase()}
                  </p>
                  {!notification.is_read && (
                    <Badge variant="default" className="bg-red-600">New</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{notification.message}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(notification.created_at).toLocaleString()}
                </p>
              </div>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
