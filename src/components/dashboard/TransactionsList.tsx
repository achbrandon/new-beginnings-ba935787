import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search,
  Filter,
  Download,
  AlertCircle
} from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TransactionDetailsModal } from "./TransactionDetailsModal";
import { TransactionExportModal } from "./TransactionExportModal";
import { SwipeableTransactionCard } from "./SwipeableTransactionCard";

interface TransactionsListProps {
  transactions: any[];
  onRefresh: () => void;
}

export function TransactionsList({ transactions, onRefresh }: TransactionsListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // Fetch favorites
  const fetchFavorites = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('favorite_transactions')
      .select('transaction_id')
      .eq('user_id', user.id);

    if (data) {
      setFavorites(new Set(data.map(f => f.transaction_id)));
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, []);

  // Subscribe to real-time transaction updates
  useEffect(() => {
    const channel = supabase
      .channel('transaction-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions'
        },
        () => {
          onRefresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onRefresh]);

  const filteredTransactions = transactions.filter(t => 
    t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.merchant?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleTransactionClick = (transaction: any) => {
    setSelectedTransaction(transaction);
    setShowDetailsModal(true);
  };

  return (
    <>
      <Card className="mobile-card-padding animate-fade-in">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold">Recent Transactions</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="hidden sm:flex">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline" size="sm" className="sm:hidden" onClick={() => setShowExportModal(true)}>
            <Download className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" className="hidden sm:flex" onClick={() => setShowExportModal(true)}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search transactions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 sm:h-11"
          />
        </div>
      </div>

      {filteredTransactions.length === 0 ? (
        <div className="text-center py-8 sm:py-12">
          <AlertCircle className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 text-muted-foreground" />
          <h3 className="text-base sm:text-lg font-medium mb-2">No transactions found</h3>
          <p className="text-sm text-muted-foreground">
            {searchQuery ? "Try adjusting your search" : "Your transactions will appear here"}
          </p>
        </div>
      ) : (
        <div className="space-y-2 sm:space-y-3">
          {filteredTransactions.map((transaction) => (
            <SwipeableTransactionCard
              key={transaction.id}
              transaction={transaction}
              isFavorite={favorites.has(transaction.id)}
              onFavoriteChange={fetchFavorites}
              onClick={() => handleTransactionClick(transaction)}
            />
          ))}
        </div>
      )}
    </Card>

      <TransactionDetailsModal
        transaction={selectedTransaction}
        open={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedTransaction(null);
        }}
      />

      <TransactionExportModal
        open={showExportModal}
        onClose={() => setShowExportModal(false)}
      />
    </>
  );
}
