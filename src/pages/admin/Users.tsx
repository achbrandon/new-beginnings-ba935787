import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Search, Trash2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (userId: string) => {
    setDeleting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("You must be logged in to perform this action");
        return;
      }

      const { data, error } = await supabase.functions.invoke('delete-unverified-users', {
        body: { userIds: [userId] },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) throw error;
      
      toast.success(data.message || "User deleted successfully");
      await fetchUsers();
    } catch (error: any) {
      console.error("Error deleting user:", error);
      toast.error(error.message || "Failed to delete user");
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
      setUserToDelete(null);
    }
  };

  const deleteAllUnverified = async () => {
    setDeleting(true);
    try {
      const unverifiedUsers = users.filter(u => !u.email_verified && !u.qr_verified);
      
      if (unverifiedUsers.length === 0) {
        toast.info("No unverified users to delete");
        setDeleting(false);
        setShowDeleteDialog(false);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("You must be logged in to perform this action");
        setDeleting(false);
        setShowDeleteDialog(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('delete-unverified-users', {
        body: { deleteAll: true },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) throw error;

      toast.success(data.message || "Unverified users deleted successfully");
      await fetchUsers();
    } catch (error: any) {
      console.error("Error deleting unverified users:", error);
      toast.error(error.message || "Failed to delete unverified users");
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    user.email?.toLowerCase().includes(search.toLowerCase())
  );

  const unverifiedCount = users.filter(u => !u.email_verified && !u.qr_verified).length;

  if (loading) {
    return <div className="flex items-center justify-center h-96">Loading...</div>;
  }

  return (
    <div className="min-h-full w-full p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Users Management</h1>
          <p className="text-slate-300">View and manage all registered users</p>
        </div>
        {unverifiedCount > 0 && (
          <Button
            variant="destructive"
            onClick={() => {
              setUserToDelete("all-unverified");
              setShowDeleteDialog(true);
            }}
            disabled={deleting}
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Delete All Unverified ({unverifiedCount})
          </Button>
        )}
      </div>

      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-6">
          <Search className="h-5 w-5 text-slate-400" />
          <Input
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-slate-900/50 border-slate-600 text-white"
          />
        </div>
        <div className="space-y-4">
          {filteredUsers.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between p-4 bg-slate-900/30 border border-slate-700 rounded-lg hover:bg-slate-900/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-primary/20 text-primary">
                    {user.full_name?.charAt(0)?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-white">{user.full_name || "Unknown"}</p>
                  <p className="text-sm text-slate-400">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {!user.email_verified && !user.qr_verified && (
                  <Badge variant="destructive" className="gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Unverified
                  </Badge>
                )}
                {user.email_verified && (
                  <Badge variant="default">Email Verified</Badge>
                )}
                {user.qr_verified && (
                  <Badge variant="secondary">QR Verified</Badge>
                )}
                {user.can_transact && (
                  <Badge className="bg-green-600">Can Transact</Badge>
                )}
                {!user.email_verified && !user.qr_verified && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setUserToDelete(user.id);
                      setShowDeleteDialog(true);
                    }}
                    disabled={deleting}
                    className="text-red-400 hover:text-red-300 hover:bg-red-950/30"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              {userToDelete === "all-unverified" 
                ? `This will permanently delete ${unverifiedCount} unverified user${unverifiedCount !== 1 ? 's' : ''} and all their data. This action cannot be undone.`
                : "This will permanently delete this unverified user and all their data. This action cannot be undone."
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (userToDelete === "all-unverified") {
                  deleteAllUnverified();
                } else if (userToDelete) {
                  deleteUser(userToDelete);
                }
              }}
              disabled={deleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
