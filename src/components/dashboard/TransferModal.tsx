import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { TransferReceipt } from "./TransferReceipt";
import { OTPVerificationModal } from "./OTPVerificationModal";

interface TransferModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function TransferModal({ onClose, onSuccess }: TransferModalProps) {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [fromAccount, setFromAccount] = useState("");
  const [toAccount, setToAccount] = useState("");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);
  const [pendingTransfer, setPendingTransfer] = useState<any>(null);

  useEffect(() => {
    fetchAccounts();
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    setProfile(data);
  };

  const fetchAccounts = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("accounts")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "active");

    if (error) {
      console.error("Error fetching accounts:", error);
    } else {
      setAccounts(data || []);
    }
  };

  const handleTransfer = async () => {
    if (!fromAccount || !toAccount || !amount) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (fromAccount === toAccount) {
      toast.error("Cannot transfer to the same account");
      return;
    }

    const transferAmount = parseFloat(amount);
    if (isNaN(transferAmount) || transferAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    // Store transfer data and show OTP
    setPendingTransfer({
      fromAccount,
      toAccount,
      amount: transferAmount,
      notes
    });
    setShowOTP(true);
  };

  const processTransfer = async () => {
    if (!pendingTransfer) return;
    
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const reference = `INT${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      const { error: transferError } = await supabase
        .from("transfers")
        .insert({
          user_id: user.id,
          from_account_id: pendingTransfer.fromAccount,
          to_account_id: pendingTransfer.toAccount,
          amount: pendingTransfer.amount,
          transfer_type: "internal",
          status: "pending",
          notes: pendingTransfer.notes || null
        });

      if (transferError) throw transferError;

      // Create transaction records for both accounts
      const fromAcc = accounts.find(a => a.id === pendingTransfer.fromAccount);
      const toAcc = accounts.find(a => a.id === pendingTransfer.toAccount);

      await supabase.from("transactions").insert([
        {
          user_id: user.id,
          account_id: pendingTransfer.fromAccount,
          transaction_type: "debit",
          amount: pendingTransfer.amount,
          description: `Transfer to ${toAcc?.account_name}`,
          category: "Transfer",
          status: "pending"
        },
        {
          user_id: user.id,
          account_id: pendingTransfer.toAccount,
          transaction_type: "credit",
          amount: pendingTransfer.amount,
          description: `Transfer from ${fromAcc?.account_name}`,
          category: "Transfer",
          status: "pending"
        }
      ]);

      // Create admin notification
      await supabase.from("admin_notifications").insert({
        notification_type: "internal_transfer",
        message: `Internal transfer: $${pendingTransfer.amount.toLocaleString()} from ${fromAcc?.account_name} to ${toAcc?.account_name}`,
        user_id: user.id
      });

      setReceiptData({
        type: 'internal',
        fromAccount: fromAcc?.account_name || '',
        toAccount: toAcc?.account_name || '',
        amount: pendingTransfer.amount.toFixed(2),
        currency: '$',
        reference,
        date: new Date(),
        status: 'pending'
      });

      setShowReceipt(true);
      onSuccess();
      toast.success("Transfer submitted! Pending admin approval - your balance will not be affected until completion.", {
        duration: 5000
      });
    } catch (error: any) {
      console.error("Transfer error:", error);
      toast.error(error.message || "Failed to complete transfer");
    } finally {
      setLoading(false);
      setPendingTransfer(null);
    }
  };

  const handleOTPVerified = () => {
    setShowOTP(false);
    processTransfer();
  };

  return (
    <>
      <Dialog open={!showReceipt && !showOTP} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Internal Transfer</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="from-account">From Account</Label>
              <Select value={fromAccount} onValueChange={setFromAccount}>
                <SelectTrigger>
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.account_name} - ${parseFloat(account.available_balance).toFixed(2)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="to-account">To Account</Label>
              <Select value={toAccount} onValueChange={setToAccount}>
                <SelectTrigger>
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.account_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Input
                id="notes"
                placeholder="Add a note..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleTransfer} disabled={loading} className="flex-1">
              {loading ? "Processing..." : "Continue"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <OTPVerificationModal
        open={showOTP}
        onClose={() => {
          setShowOTP(false);
          setPendingTransfer(null);
        }}
        onVerify={handleOTPVerified}
        email={profile?.email || ""}
      />

      {showReceipt && receiptData && (
        <TransferReceipt
          open={showReceipt}
          onClose={() => {
            setShowReceipt(false);
            onClose();
          }}
          transferData={receiptData}
        />
      )}
    </>
  );
}
