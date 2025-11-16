import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Bell, Search, CheckCircle2, Clock, User } from "lucide-react";
import { format } from "date-fns";

interface NotificationHistoryItem {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
  sent_by_admin_id: string | null;
  sent_at: string | null;
  user_name: string | null;
  user_email: string | null;
  admin_name: string | null;
  admin_email: string | null;
}

export default function NotificationHistory() {
  const [notifications, setNotifications] = useState<NotificationHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchNotificationHistory();
  }, []);

  const fetchNotificationHistory = async () => {
    try {
      setLoading(true);
      
      // Fetch all alerts sent by admins with user and admin details
      const { data: alerts, error } = await supabase
        .from("alerts")
        .select("*")
        .not("sent_by_admin_id", "is", null)
        .order("sent_at", { ascending: false });

      if (error) throw error;

      // Fetch user profiles
      const userIds = [...new Set(alerts?.map(a => a.user_id) || [])];
      const adminIds = [...new Set(alerts?.map(a => a.sent_by_admin_id).filter(Boolean) || [])];
      
      const { data: userProfiles } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds);

      const { data: adminProfiles } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", adminIds);

      // Map profiles to alerts
      const enrichedAlerts = alerts?.map(alert => {
        const user = userProfiles?.find(p => p.id === alert.user_id);
        const admin = adminProfiles?.find(p => p.id === alert.sent_by_admin_id);
        
        return {
          ...alert,
          user_name: user?.full_name || null,
          user_email: user?.email || null,
          admin_name: admin?.full_name || null,
          admin_email: admin?.email || null,
        };
      }) || [];

      setNotifications(enrichedAlerts);
    } catch (error) {
      console.error("Error fetching notification history:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "success": return "bg-green-500";
      case "error": return "bg-red-500";
      case "warning": return "bg-yellow-500";
      case "info": return "bg-blue-500";
      case "pending": return "bg-orange-500";
      default: return "bg-gray-500";
    }
  };

  const filteredNotifications = notifications.filter(notification =>
    notification.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    notification.message?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    notification.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    notification.user_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    notification.admin_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-white">Loading notification history...</div>
      </div>
    );
  }

  return (
    <div className="min-h-full w-full p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Notification History</h1>
        <p className="text-slate-400">View all notifications sent by administrators</p>
      </div>

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Bell className="h-5 w-5" />
            All Sent Notifications ({filteredNotifications.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by title, message, user, or admin..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-slate-700 border-slate-600 text-white"
            />
          </div>

          <ScrollArea className="h-[600px]">
            <div className="space-y-3">
              {filteredNotifications.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  No notifications found
                </div>
              ) : (
                filteredNotifications.map((notification) => (
                  <Card
                    key={notification.id}
                    className="bg-slate-700 border-slate-600 hover:bg-slate-600 transition-colors"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge className={getTypeColor(notification.type)}>
                              {notification.type}
                            </Badge>
                            {notification.is_read ? (
                              <Badge variant="outline" className="text-green-400 border-green-400">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Read
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-slate-400 border-slate-400">
                                <Clock className="h-3 w-3 mr-1" />
                                Unread
                              </Badge>
                            )}
                          </div>
                          
                          <div>
                            <h3 className="font-semibold text-white">{notification.title}</h3>
                            <p className="text-sm text-slate-300 mt-1">{notification.message}</p>
                          </div>

                          <div className="flex flex-wrap gap-4 text-xs text-slate-400 pt-2 border-t border-slate-600">
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              <span>To: {notification.user_name || notification.user_email || "Unknown"}</span>
                            </div>
                            {notification.admin_name && (
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                <span>From: {notification.admin_name}</span>
                              </div>
                            )}
                            {notification.sent_at && (
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span>
                                  {format(new Date(notification.sent_at), "MMM d, yyyy 'at' h:mm a")}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
