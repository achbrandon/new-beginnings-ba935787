import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Wallet, Edit, Check, X, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

export default function AdminWalletSettings() {
  const [addresses, setAddresses] = useState<any[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [addressToDelete, setAddressToDelete] = useState<string | null>(null);
  const [addingNew, setAddingNew] = useState(false);
  const [newAddress, setNewAddress] = useState({
    currency: "",
    network: "",
    wallet_address: "",
  });

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    const { data } = await supabase
      .from("crypto_deposit_addresses")
      .select("*")
      .order("currency");
    
    if (data) setAddresses(data);
  };

  const startEdit = (address: any) => {
    setEditing(address.id);
    setEditValue(address.wallet_address);
  };

  const cancelEdit = () => {
    setEditing(null);
    setEditValue("");
  };

  const saveEdit = async (id: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("crypto_deposit_addresses")
        .update({
          wallet_address: editValue,
          updated_at: new Date().toISOString(),
          updated_by: user.id
        })
        .eq("id", id);

      if (error) throw error;

      toast.success("Wallet address updated successfully");
      setEditing(null);
      setEditValue("");
      fetchAddresses();
    } catch (error) {
      console.error("Error updating address:", error);
      toast.error("Failed to update wallet address");
    }
  };

  const confirmDelete = (id: string) => {
    setAddressToDelete(id);
    setDeleteDialogOpen(true);
  };

  const deleteAddress = async () => {
    if (!addressToDelete) return;

    try {
      const { error } = await supabase
        .from("crypto_deposit_addresses")
        .delete()
        .eq("id", addressToDelete);

      if (error) throw error;

      toast.success("Wallet address deleted successfully");
      setDeleteDialogOpen(false);
      setAddressToDelete(null);
      fetchAddresses();
    } catch (error) {
      console.error("Error deleting address:", error);
      toast.error("Failed to delete wallet address");
    }
  };

  const addNewAddress = async () => {
    if (!newAddress.currency || !newAddress.wallet_address) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("crypto_deposit_addresses")
        .insert({
          currency: newAddress.currency,
          network: newAddress.network || null,
          wallet_address: newAddress.wallet_address,
          is_active: true,
          updated_by: user.id
        });

      if (error) throw error;

      toast.success("New wallet address added successfully");
      setAddingNew(false);
      setNewAddress({ currency: "", network: "", wallet_address: "" });
      fetchAddresses();
    } catch (error) {
      console.error("Error adding address:", error);
      toast.error("Failed to add wallet address");
    }
  };

  return (
    <div className="min-h-full w-full p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Wallet Management</h1>
        <p className="text-slate-300">Manage crypto deposit addresses for all users</p>
      </div>

      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Crypto Deposit Addresses
              </CardTitle>
              <p className="text-slate-400 text-sm mt-1">
                These addresses will be shown to all users when they deposit crypto
              </p>
            </div>
            <Button
              onClick={() => setAddingNew(true)}
              className="bg-primary hover:bg-primary/90"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Address
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {addingNew && (
            <div className="p-4 bg-slate-900/50 border border-primary rounded-lg space-y-4">
              <h3 className="text-white font-semibold">Add New Wallet Address</h3>
              
              <div className="space-y-2">
                <Label className="text-white">Currency *</Label>
                <Select
                  value={newAddress.currency}
                  onValueChange={(value) => setNewAddress({ ...newAddress, currency: value })}
                >
                  <SelectTrigger className="bg-slate-900 border-slate-600 text-white">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BTC">Bitcoin (BTC)</SelectItem>
                    <SelectItem value="ETH">Ethereum (ETH)</SelectItem>
                    <SelectItem value="USDT">Tether (USDT)</SelectItem>
                    <SelectItem value="USDC">USD Coin (USDC)</SelectItem>
                    <SelectItem value="BNB">Binance Coin (BNB)</SelectItem>
                    <SelectItem value="SOL">Solana (SOL)</SelectItem>
                    <SelectItem value="XRP">Ripple (XRP)</SelectItem>
                    <SelectItem value="ADA">Cardano (ADA)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-white">Network (optional)</Label>
                <Input
                  value={newAddress.network}
                  onChange={(e) => setNewAddress({ ...newAddress, network: e.target.value })}
                  placeholder="e.g., ERC20, TRC20, BEP20"
                  className="bg-slate-900 border-slate-600 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white">Wallet Address *</Label>
                <Input
                  value={newAddress.wallet_address}
                  onChange={(e) => setNewAddress({ ...newAddress, wallet_address: e.target.value })}
                  placeholder="Enter wallet address"
                  className="bg-slate-900 border-slate-600 text-white font-mono"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={addNewAddress}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Add Address
                </Button>
                <Button
                  onClick={() => {
                    setAddingNew(false);
                    setNewAddress({ currency: "", network: "", wallet_address: "" });
                  }}
                  variant="outline"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          )}
          {addresses.map((address) => (
            <div
              key={address.id}
              className="p-4 bg-slate-900/50 border border-slate-700 rounded-lg"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="text-lg px-3 py-1">
                    {address.currency}
                  </Badge>
                  <span className="text-slate-400 text-sm">{address.network}</span>
                </div>
                <Badge variant={address.is_active ? "default" : "secondary"}>
                  {address.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>

              {editing === address.id ? (
                <div className="space-y-3">
                  <Label className="text-white">Wallet Address</Label>
                  <Input
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="bg-slate-900 border-slate-600 text-white font-mono"
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={() => saveEdit(address.id)}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Save
                    </Button>
                    <Button
                      onClick={cancelEdit}
                      size="sm"
                      variant="outline"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <code className="text-sm text-white bg-slate-900 px-3 py-2 rounded border border-slate-600 font-mono break-all flex-1">
                      {address.wallet_address}
                    </code>
                    <div className="flex gap-1">
                      <Button
                        onClick={() => startEdit(address)}
                        size="sm"
                        variant="ghost"
                        title="Edit address"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => confirmDelete(address.id)}
                        size="sm"
                        variant="ghost"
                        className="text-red-400 hover:text-red-300 hover:bg-red-950/20"
                        title="Delete address"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {address.updated_at && (
                    <p className="text-xs text-slate-500">
                      Last updated: {new Date(address.updated_at).toLocaleString()}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="bg-blue-900/20 border-blue-700">
        <CardContent className="pt-6">
          <p className="text-blue-200 text-sm">
            <strong>Important:</strong> Changes to wallet addresses will be immediately visible to all users. 
            Make sure to verify addresses carefully before saving. All crypto deposits will be directed to these addresses.
          </p>
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Wallet Address</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this wallet address? This action cannot be undone.
              Users will no longer see this address when depositing crypto.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteAddress}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Address
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
