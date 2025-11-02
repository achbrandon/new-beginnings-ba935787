import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, Plus, DollarSign, KeyRound, Upload, FileText } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export default function AdminUserManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [depositAmount, setDepositAmount] = useState("");
  const [depositDate, setDepositDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedAccount, setSelectedAccount] = useState("");
  const [notes, setNotes] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [passwordResetDialogOpen, setPasswordResetDialogOpen] = useState(false);
  const [passwordResetUser, setPasswordResetUser] = useState<any>(null);
  const [resetNotes, setResetNotes] = useState("");
  const [documentDialogOpen, setDocumentDialogOpen] = useState(false);
  const [documentUser, setDocumentUser] = useState<any>(null);
  const [documents, setDocuments] = useState({
    idFront: null as File | null,
    idBack: null as File | null,
    selfie: null as File | null,
    addressProof: null as File | null,
  });
  const [documentNotes, setDocumentNotes] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;
      setUsers(profilesData || []);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const fetchUserAccounts = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("accounts")
        .select("*")
        .eq("user_id", userId);

      if (error) throw error;
      setAccounts(data || []);
    } catch (error) {
      console.error("Error fetching accounts:", error);
      toast.error("Failed to load accounts");
    }
  };

  const handleTopUp = async () => {
    if (!selectedAccount || !depositAmount || !depositDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Insert manual deposit record
      const { error: depositError } = await supabase
        .from("manual_deposits")
        .insert({
          user_id: selectedUser.id,
          account_id: selectedAccount,
          amount: parseFloat(depositAmount),
          deposit_date: new Date(depositDate).toISOString(),
          created_by: user.id,
          notes: notes || null,
          status: "completed"
        });

      if (depositError) throw depositError;

      // Update account balance
      const account = accounts.find(a => a.id === selectedAccount);
      const newBalance = parseFloat(account.balance) + parseFloat(depositAmount);

      const { error: updateError } = await supabase
        .from("accounts")
        .update({ 
          balance: newBalance,
          available_balance: newBalance
        })
        .eq("id", selectedAccount);

      if (updateError) throw updateError;

      // Create transaction record
      const { error: transactionError } = await supabase
        .from("transactions")
        .insert({
          user_id: selectedUser.id,
          account_id: selectedAccount,
          transaction_type: "deposit",
          amount: parseFloat(depositAmount),
          description: `Manual deposit by admin${notes ? ': ' + notes : ''}`,
          status: "completed",
          transaction_date: new Date(depositDate).toISOString(),
          category: "Deposit",
          merchant: "Bank Deposit"
        });

      if (transactionError) throw transactionError;

      toast.success("Account topped up successfully");
      setDialogOpen(false);
      setDepositAmount("");
      setNotes("");
      setSelectedAccount("");
      fetchUserAccounts(selectedUser.id);
    } catch (error: any) {
      console.error("Error topping up account:", error);
      toast.error(error.message || "Failed to top up account");
    }
  };

  const openTopUpDialog = async (user: any) => {
    setSelectedUser(user);
    await fetchUserAccounts(user.id);
    setDialogOpen(true);
  };

  const handlePasswordReset = async () => {
    if (!passwordResetUser) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Send password reset email
      const { error } = await supabase.auth.resetPasswordForEmail(passwordResetUser.email, {
        redirectTo: `${window.location.origin}/auth`,
      });

      if (error) throw error;

      // Log admin action
      await supabase.from("admin_actions_log").insert({
        admin_id: user.id,
        action_type: "password_reset",
        target_user_id: passwordResetUser.id,
        details: {
          notes: resetNotes,
          timestamp: new Date().toISOString(),
        },
      });

      toast.success(`Password reset email sent to ${passwordResetUser.email}`);
      setPasswordResetDialogOpen(false);
      setPasswordResetUser(null);
      setResetNotes("");
    } catch (error: any) {
      console.error("Error resetting password:", error);
      toast.error(error.message || "Failed to send password reset email");
    }
  };

  const openPasswordResetDialog = (user: any) => {
    setPasswordResetUser(user);
    setPasswordResetDialogOpen(true);
  };

  const openDocumentDialog = (user: any) => {
    setDocumentUser(user);
    setDocumentDialogOpen(true);
  };

  const uploadFile = async (file: File, userId: string, docType: string): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${userId}/${docType}-${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('account-documents')
        .upload(filePath, file, { upsert: true });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('account-documents')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error(`Failed to upload ${docType}`);
      return null;
    }
  };

  const handleDocumentUpload = async () => {
    if (!documentUser) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Upload documents
      const uploadPromises = [];
      if (documents.idFront) {
        uploadPromises.push(uploadFile(documents.idFront, documentUser.id, 'id-front'));
      }
      if (documents.idBack) {
        uploadPromises.push(uploadFile(documents.idBack, documentUser.id, 'id-back'));
      }
      if (documents.selfie) {
        uploadPromises.push(uploadFile(documents.selfie, documentUser.id, 'selfie'));
      }
      if (documents.addressProof) {
        uploadPromises.push(uploadFile(documents.addressProof, documentUser.id, 'address-proof'));
      }

      const urls = await Promise.all(uploadPromises);
      
      // Get existing application or create update object
      const { data: existingApp } = await supabase
        .from("account_applications")
        .select("*")
        .eq("user_id", documentUser.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      const updateData: any = {};
      let urlIndex = 0;
      if (documents.idFront) updateData.id_front_url = urls[urlIndex++];
      if (documents.idBack) updateData.id_back_url = urls[urlIndex++];
      if (documents.selfie) updateData.selfie_url = urls[urlIndex++];
      if (documents.addressProof) updateData.address_proof_url = urls[urlIndex++];

      if (existingApp) {
        // Update existing application
        const { error: updateError } = await supabase
          .from("account_applications")
          .update(updateData)
          .eq("id", existingApp.id);

        if (updateError) throw updateError;
      } else {
        // Create new application with documents
        const { error: insertError } = await supabase
          .from("account_applications")
          .insert({
            user_id: documentUser.id,
            full_name: documentUser.full_name || "Unknown",
            email: documentUser.email,
            account_type: "personal",
            status: "pending",
            ...updateData,
          });

        if (insertError) throw insertError;
      }

      // Log admin action
      await supabase.from("admin_actions_log").insert({
        admin_id: user.id,
        action_type: "document_upload",
        target_user_id: documentUser.id,
        details: {
          documents_uploaded: Object.keys(documents).filter(key => documents[key as keyof typeof documents] !== null),
          notes: documentNotes,
          timestamp: new Date().toISOString(),
        },
      });

      toast.success("Documents uploaded successfully");
      setDocumentDialogOpen(false);
      setDocumentUser(null);
      setDocuments({
        idFront: null,
        idBack: null,
        selfie: null,
        addressProof: null,
      });
      setDocumentNotes("");
    } catch (error: any) {
      console.error("Error uploading documents:", error);
      toast.error(error.message || "Failed to upload documents");
    }
  };

  const filteredUsers = users.filter(user =>
    user.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    user.email?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return <div className="flex items-center justify-center h-96">Loading...</div>;
  }

  return (
    <div className="min-h-full w-full p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">User Account Management</h1>
        <p className="text-slate-300">Manage user accounts and process manual deposits</p>
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
                {user.can_transact && (
                  <Badge className="bg-green-600">Can Transact</Badge>
                )}
                <Button
                  onClick={() => openDocumentDialog(user)}
                  variant="outline"
                  className="bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 border-blue-500/50"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Docs
                </Button>
                <Button
                  onClick={() => openPasswordResetDialog(user)}
                  variant="outline"
                  className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border-amber-500/50"
                >
                  <KeyRound className="h-4 w-4 mr-2" />
                  Reset Password
                </Button>
                <Dialog open={dialogOpen && selectedUser?.id === user.id} onOpenChange={(open) => {
                  setDialogOpen(open);
                  if (!open) setSelectedUser(null);
                }}>
                  <DialogTrigger asChild>
                    <Button
                      onClick={() => openTopUpDialog(user)}
                      className="bg-primary hover:bg-primary/90"
                    >
                      <DollarSign className="h-4 w-4 mr-2" />
                      Top Up
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-slate-900 border-slate-700">
                    <DialogHeader>
                      <DialogTitle className="text-white">Manual Deposit - {user.full_name}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label className="text-slate-300">Select Account</Label>
                        <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                          <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                            <SelectValue placeholder="Select account" />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-900 border-slate-700 z-50">
                            {accounts.length === 0 ? (
                              <div className="p-4 text-slate-400 text-sm">No accounts found</div>
                            ) : (
                              accounts.map((account) => (
                                <SelectItem key={account.id} value={account.id} className="text-white hover:bg-slate-800 focus:bg-slate-800">
                                  {account.account_name} - {account.account_type} (${parseFloat(account.balance).toFixed(2)})
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-slate-300">Amount</Label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={depositAmount}
                          onChange={(e) => setDepositAmount(e.target.value)}
                          className="bg-slate-800 border-slate-700 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-slate-300">Deposit Date (Backdate if needed)</Label>
                        <Input
                          type="date"
                          value={depositDate}
                          onChange={(e) => setDepositDate(e.target.value)}
                          className="bg-slate-800 border-slate-700 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-slate-300">Notes (Optional)</Label>
                        <Textarea
                          placeholder="Add any notes about this deposit..."
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          className="bg-slate-800 border-slate-700 text-white"
                        />
                      </div>
                      <Button
                        onClick={handleTopUp}
                        className="w-full bg-primary hover:bg-primary/90"
                      >
                        Process Deposit
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Password Reset Dialog */}
      <Dialog open={passwordResetDialogOpen} onOpenChange={setPasswordResetDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Reset Password - {passwordResetUser?.full_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
              <p className="text-amber-500 text-sm">
                This will send a password reset link to <strong>{passwordResetUser?.email}</strong>. 
                The user will be able to set a new password through the secure link.
              </p>
            </div>
            <div>
              <Label className="text-slate-300">Admin Notes (Optional)</Label>
              <Textarea
                placeholder="Reason for password reset..."
                value={resetNotes}
                onChange={(e) => setResetNotes(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handlePasswordReset}
                className="flex-1 bg-amber-500 hover:bg-amber-600"
              >
                <KeyRound className="h-4 w-4 mr-2" />
                Send Reset Link
              </Button>
              <Button
                variant="outline"
                onClick={() => setPasswordResetDialogOpen(false)}
                className="bg-slate-800 border-slate-700 text-white"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Document Upload Dialog */}
      <Dialog open={documentDialogOpen} onOpenChange={setDocumentDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Upload Documents - {documentUser?.full_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <p className="text-blue-500 text-sm flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Upload verification documents for <strong>{documentUser?.email}</strong>
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-300">ID Front</Label>
                <div className="mt-2">
                  <label className="flex items-center justify-center w-full h-32 border-2 border-dashed border-slate-600 rounded-lg cursor-pointer hover:bg-slate-800/50 transition-colors">
                    <div className="text-center">
                      <Upload className="mx-auto h-8 w-8 text-slate-400" />
                      <span className="text-sm text-slate-400">
                        {documents.idFront ? documents.idFront.name : "Upload Front"}
                      </span>
                    </div>
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*"
                      onChange={(e) => setDocuments(prev => ({ ...prev, idFront: e.target.files?.[0] || null }))}
                    />
                  </label>
                </div>
              </div>

              <div>
                <Label className="text-slate-300">ID Back</Label>
                <div className="mt-2">
                  <label className="flex items-center justify-center w-full h-32 border-2 border-dashed border-slate-600 rounded-lg cursor-pointer hover:bg-slate-800/50 transition-colors">
                    <div className="text-center">
                      <Upload className="mx-auto h-8 w-8 text-slate-400" />
                      <span className="text-sm text-slate-400">
                        {documents.idBack ? documents.idBack.name : "Upload Back"}
                      </span>
                    </div>
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*"
                      onChange={(e) => setDocuments(prev => ({ ...prev, idBack: e.target.files?.[0] || null }))}
                    />
                  </label>
                </div>
              </div>

              <div>
                <Label className="text-slate-300">Selfie</Label>
                <div className="mt-2">
                  <label className="flex items-center justify-center w-full h-32 border-2 border-dashed border-slate-600 rounded-lg cursor-pointer hover:bg-slate-800/50 transition-colors">
                    <div className="text-center">
                      <Upload className="mx-auto h-8 w-8 text-slate-400" />
                      <span className="text-sm text-slate-400">
                        {documents.selfie ? documents.selfie.name : "Upload Selfie"}
                      </span>
                    </div>
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*"
                      onChange={(e) => setDocuments(prev => ({ ...prev, selfie: e.target.files?.[0] || null }))}
                    />
                  </label>
                </div>
              </div>

              <div>
                <Label className="text-slate-300">Address Proof</Label>
                <div className="mt-2">
                  <label className="flex items-center justify-center w-full h-32 border-2 border-dashed border-slate-600 rounded-lg cursor-pointer hover:bg-slate-800/50 transition-colors">
                    <div className="text-center">
                      <Upload className="mx-auto h-8 w-8 text-slate-400" />
                      <span className="text-sm text-slate-400">
                        {documents.addressProof ? documents.addressProof.name : "Upload Proof"}
                      </span>
                    </div>
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*,application/pdf"
                      onChange={(e) => setDocuments(prev => ({ ...prev, addressProof: e.target.files?.[0] || null }))}
                    />
                  </label>
                </div>
              </div>
            </div>

            <div>
              <Label className="text-slate-300">Admin Notes (Optional)</Label>
              <Textarea
                placeholder="Notes about these documents..."
                value={documentNotes}
                onChange={(e) => setDocumentNotes(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleDocumentUpload}
                className="flex-1 bg-blue-500 hover:bg-blue-600"
                disabled={!documents.idFront && !documents.idBack && !documents.selfie && !documents.addressProof}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Documents
              </Button>
              <Button
                variant="outline"
                onClick={() => setDocumentDialogOpen(false)}
                className="bg-slate-800 border-slate-700 text-white"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
