import { useState, useRef, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { 
  Wallet,
  ArrowUpRight,
  ArrowLeftRight,
  CreditCard,
  Receipt,
  Heart,
  Info
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SwipeableTransactionCardProps {
  transaction: any;
  isFavorite: boolean;
  onFavoriteChange: () => void;
  onClick: () => void;
}

export function SwipeableTransactionCard({ 
  transaction, 
  isFavorite,
  onFavoriteChange,
  onClick 
}: SwipeableTransactionCardProps) {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();

  const SWIPE_THRESHOLD = 80;
  const MAX_SWIPE = 120;

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartX(e.touches[0].clientX);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    
    const currentX = e.touches[0].clientX;
    const diff = currentX - startX;
    
    // Apply resistance for smoother feel
    const resistance = 0.7;
    const limitedDiff = Math.max(-MAX_SWIPE, Math.min(MAX_SWIPE, diff * resistance));
    
    setSwipeOffset(limitedDiff);
  };

  const handleTouchEnd = async () => {
    setIsDragging(false);

    // Swipe right = favorite (positive offset)
    if (swipeOffset > SWIPE_THRESHOLD) {
      await handleFavorite();
      animateBack();
    }
    // Swipe left = view details (negative offset)
    else if (swipeOffset < -SWIPE_THRESHOLD) {
      animateBack();
      setTimeout(() => onClick(), 200);
    }
    // Not enough swipe, return to position
    else {
      animateBack();
    }
  };

  const animateBack = () => {
    const animate = () => {
      setSwipeOffset(prev => {
        const newOffset = prev * 0.8;
        if (Math.abs(newOffset) < 0.5) {
          return 0;
        }
        animationRef.current = requestAnimationFrame(animate);
        return newOffset;
      });
    };
    animate();
  };

  const handleFavorite = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (isFavorite) {
        // Remove from favorites
        const { error } = await supabase
          .from('favorite_transactions')
          .delete()
          .eq('user_id', user.id)
          .eq('transaction_id', transaction.id);

        if (error) throw error;
        toast.success("Removed from favorites");
      } else {
        // Add to favorites
        const { error } = await supabase
          .from('favorite_transactions')
          .insert({
            user_id: user.id,
            transaction_id: transaction.id
          });

        if (error) throw error;
        toast.success("Added to favorites");
      }

      onFavoriteChange();
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error("Failed to update favorite");
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'deposit':
      case 'credit':
        return <Wallet className="h-5 w-5 text-green-600 dark:text-green-400" />;
      case 'withdrawal':
      case 'debit':
        return <ArrowUpRight className="h-5 w-5 text-red-600 dark:text-red-400" />;
      case 'transfer':
        return <ArrowLeftRight className="h-5 w-5 text-blue-600 dark:text-blue-400" />;
      case 'payment':
        return <CreditCard className="h-5 w-5 text-purple-600 dark:text-purple-400" />;
      case 'fee':
        return <Receipt className="h-5 w-5 text-orange-600 dark:text-orange-400" />;
      default:
        return <Wallet className="h-5 w-5 text-gray-600 dark:text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
      completed: "default",
      pending: "secondary",
      failed: "destructive",
      disputed: "outline"
    };
    return <Badge variant={variants[status] || "secondary"} className="text-xs">{status}</Badge>;
  };

  // Replace "Admin" with "Deposit"
  let cleanDescription = transaction.description;
  if (cleanDescription) {
    cleanDescription = cleanDescription.replace(/\bAdmin\b/gi, 'Deposit');
  }

  const swipeProgress = Math.abs(swipeOffset) / MAX_SWIPE;
  const isCredit = transaction.type === 'credit' || transaction.type === 'deposit';

  return (
    <div className="relative overflow-hidden rounded-lg">
      {/* Background Actions */}
      <div className="absolute inset-0 flex items-center justify-between px-4 rounded-lg">
        {/* Right swipe action (Favorite) - shows on left side */}
        <div 
          className={`flex items-center gap-2 transition-all duration-200 ${
            swipeOffset > 0 ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
          }`}
          style={{
            transform: `translateX(${Math.min(swipeOffset * 0.3, 30)}px)`
          }}
        >
          <div className={`p-2 rounded-full ${
            isFavorite 
              ? 'bg-red-100 dark:bg-red-900/30' 
              : 'bg-green-100 dark:bg-green-900/30'
          }`}>
            <Heart 
              className={`h-5 w-5 ${
                isFavorite 
                  ? 'text-red-600 dark:text-red-400 fill-current' 
                  : 'text-green-600 dark:text-green-400'
              }`}
            />
          </div>
          <span className="text-sm font-medium text-muted-foreground">
            {isFavorite ? 'Unfavorite' : 'Favorite'}
          </span>
        </div>

        {/* Left swipe action (Details) - shows on right side */}
        <div 
          className={`flex items-center gap-2 transition-all duration-200 ${
            swipeOffset < 0 ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
          }`}
          style={{
            transform: `translateX(${Math.max(swipeOffset * 0.3, -30)}px)`
          }}
        >
          <span className="text-sm font-medium text-muted-foreground">
            Details
          </span>
          <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30">
            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
      </div>

      {/* Swipeable Card */}
      <div
        ref={cardRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={onClick}
        className="relative flex items-center justify-between p-3 sm:p-4 rounded-lg border bg-card hover:bg-muted/50 cursor-pointer touch-pan-y"
        style={{
          transform: `translateX(${swipeOffset}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          opacity: 1 - swipeProgress * 0.2,
        }}
      >
        <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
          <div className="shrink-0 relative">
            <div className={`h-10 w-10 rounded-full ${
              isCredit 
                ? 'bg-green-100 dark:bg-green-900/20' 
                : 'bg-red-100 dark:bg-red-900/20'
            } flex items-center justify-center`}>
              {getTransactionIcon(transaction.type)}
            </div>
            {isFavorite && (
              <div className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center">
                <Heart className="h-2.5 w-2.5 text-white fill-current" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-medium capitalize text-sm sm:text-base truncate">{cleanDescription}</p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <p className="text-xs sm:text-sm text-muted-foreground">
                {new Date(transaction.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: window.innerWidth < 640 ? undefined : 'numeric'
                })}
              </p>
              {transaction.category && (
                <>
                  <span className="text-muted-foreground hidden sm:inline">•</span>
                  <span className="text-xs sm:text-sm text-muted-foreground capitalize hidden sm:inline">
                    {transaction.category}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="text-right shrink-0 ml-2">
          <p className={`font-semibold text-sm sm:text-base ${
            isCredit
              ? 'text-green-600 dark:text-green-400'
              : 'text-red-600 dark:text-red-400'
          }`}>
            {isCredit ? '+' : '-'}
            ${Math.abs(parseFloat(transaction.amount)).toFixed(2)}
          </p>
          <div className="mt-1">
            {getStatusBadge(transaction.status)}
          </div>
        </div>
      </div>

      {/* Swipe indicator hints */}
      {!isDragging && swipeOffset === 0 && (
        <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-green-500/20 via-transparent to-blue-500/20 pointer-events-none" />
      )}
    </div>
  );
}
