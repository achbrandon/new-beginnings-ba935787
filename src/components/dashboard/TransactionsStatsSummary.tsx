import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, DollarSign, ArrowUpRight, ArrowDownRight, ChevronDown, ChevronUp } from "lucide-react";
import { useCountUp } from "@/hooks/useCountUp";
import { useState, useEffect } from "react";

interface TransactionsStatsSummaryProps {
  transactions: any[];
}

export function TransactionsStatsSummary({ transactions }: TransactionsStatsSummaryProps) {
  // Collapse state - persist in localStorage
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('statsCollapsed');
    return saved === 'true';
  });

  useEffect(() => {
    localStorage.setItem('statsCollapsed', isCollapsed.toString());
  }, [isCollapsed]);

  // Haptic feedback function
  const triggerHaptic = () => {
    // Check if vibration API is supported
    if ('vibrate' in navigator) {
      // Light haptic feedback (10ms vibration)
      navigator.vibrate(10);
    }
  };

  const handleToggle = () => {
    triggerHaptic();
    setIsCollapsed(!isCollapsed);
  };

  // Calculate statistics
  const stats = transactions.reduce(
    (acc, transaction) => {
      const amount = parseFloat(transaction.amount);
      const isIncome = transaction.type === 'credit' || transaction.type === 'deposit';
      
      if (isIncome) {
        acc.income += amount;
      } else {
        acc.expenses += amount;
      }
      
      return acc;
    },
    { income: 0, expenses: 0 }
  );

  const netChange = stats.income - stats.expenses;
  const isPositive = netChange >= 0;

  // Animated counters
  const animatedIncome = useCountUp({ end: stats.income, duration: 1500 });
  const animatedExpenses = useCountUp({ end: stats.expenses, duration: 1500 });
  const animatedNetChange = useCountUp({ end: netChange, duration: 1500 });

  // Format currency with compact notation for very large numbers
  const formatCurrency = (amount: number) => {
    const absAmount = Math.abs(amount);
    
    // Use compact notation for numbers over 1 million
    if (absAmount >= 1000000) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        notation: 'compact',
        compactDisplay: 'short',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      }).format(amount);
    }
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className="mb-3 sm:mb-6 w-full">
      {/* Toggle Button - Mobile Only */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleToggle}
        className="w-full flex items-center justify-between mb-2 px-2 sm:hidden hover:bg-accent/50"
      >
        <span className="text-sm font-medium">Transaction Statistics</span>
        {isCollapsed ? (
          <ChevronDown className="h-4 w-4 transition-transform duration-300" />
        ) : (
          <ChevronUp className="h-4 w-4 transition-transform duration-300" />
        )}
      </Button>

      {/* Stats Cards */}
      <div 
        className={`w-full grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 overflow-hidden transition-all duration-500 ease-in-out sm:!max-h-none sm:!opacity-100 ${
          isCollapsed 
            ? 'max-h-0 opacity-0 sm:max-h-none sm:opacity-100' 
            : 'max-h-[600px] opacity-100'
        }`}
        style={{
          transform: isCollapsed ? 'translateY(-10px)' : 'translateY(0)',
          transition: 'max-height 0.5s ease-in-out, opacity 0.5s ease-in-out, transform 0.5s ease-in-out'
        }}
      >
      {/* Income Card */}
      <Card className="w-full p-3 sm:p-5 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/10 border-green-200 dark:border-green-900/30 hover:shadow-md transition-all animate-scale-in overflow-hidden" style={{ animationDelay: '0ms' }}>
        <div className="flex flex-col gap-1.5 sm:gap-2 w-full">
          <div className="flex items-center gap-2 w-full">
            <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-xs sm:text-sm font-medium text-muted-foreground">Income</p>
          </div>
          <div className="flex flex-col gap-0.5 sm:gap-1 w-full min-w-0">
            <p className="text-lg sm:text-2xl font-bold text-green-700 dark:text-green-400 leading-none">
              {formatCurrency(animatedIncome)}
            </p>
            <div className="flex items-center gap-1 flex-wrap mt-1">
              <ArrowUpRight className="h-3 w-3 text-green-600 dark:text-green-500 shrink-0" />
              <p className="text-[10px] sm:text-xs text-green-600 dark:text-green-500 font-medium">
                {transactions.filter(t => t.type === 'credit' || t.type === 'deposit').length} transactions
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Expenses Card */}
      <Card className="w-full p-3 sm:p-5 bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/10 border-red-200 dark:border-red-900/30 hover:shadow-md transition-all animate-scale-in overflow-hidden" style={{ animationDelay: '100ms' }}>
        <div className="flex flex-col gap-1.5 sm:gap-2 w-full">
          <div className="flex items-center gap-2 w-full">
            <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
              <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-red-600 dark:text-red-400" />
            </div>
            <p className="text-xs sm:text-sm font-medium text-muted-foreground">Expenses</p>
          </div>
          <div className="flex flex-col gap-0.5 sm:gap-1 w-full min-w-0">
            <p className="text-lg sm:text-2xl font-bold text-red-700 dark:text-red-400 leading-none">
              {formatCurrency(animatedExpenses)}
            </p>
            <div className="flex items-center gap-1 flex-wrap mt-1">
              <ArrowDownRight className="h-3 w-3 text-red-600 dark:text-red-500 shrink-0" />
              <p className="text-[10px] sm:text-xs text-red-600 dark:text-red-500 font-medium">
                {transactions.filter(t => t.type !== 'credit' && t.type !== 'deposit').length} transactions
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Net Change Card */}
      <Card className={`w-full p-3 sm:p-5 ${
        isPositive 
          ? 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/10 border-blue-200 dark:border-blue-900/30' 
          : 'bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/10 border-orange-200 dark:border-orange-900/30'
      } hover:shadow-md transition-all animate-scale-in overflow-hidden`} style={{ animationDelay: '200ms' }}>
        <div className="flex flex-col gap-1.5 sm:gap-2 w-full">
          <div className="flex items-center gap-2 w-full">
            <div className={`h-6 w-6 sm:h-8 sm:w-8 rounded-full ${
              isPositive 
                ? 'bg-blue-100 dark:bg-blue-900/30' 
                : 'bg-orange-100 dark:bg-orange-900/30'
            } flex items-center justify-center shrink-0`}>
              <DollarSign className={`h-3 w-3 sm:h-4 sm:w-4 ${
                isPositive 
                  ? 'text-blue-600 dark:text-blue-400' 
                  : 'text-orange-600 dark:text-orange-400'
              }`} />
            </div>
            <p className="text-xs sm:text-sm font-medium text-muted-foreground">Net Change</p>
          </div>
          <div className="flex flex-col gap-0.5 sm:gap-1 w-full min-w-0">
            <p className={`text-lg sm:text-2xl font-bold leading-none ${
              isPositive 
                ? 'text-blue-700 dark:text-blue-400' 
                : 'text-orange-700 dark:text-orange-400'
            }`}>
              {isPositive ? '+' : ''}{formatCurrency(animatedNetChange)}
            </p>
            <div className="flex items-center gap-1 flex-wrap mt-1">
              {isPositive ? (
                <TrendingUp className="h-3 w-3 text-blue-600 dark:text-blue-500 shrink-0" />
              ) : (
                <TrendingDown className="h-3 w-3 text-orange-600 dark:text-orange-500 shrink-0" />
              )}
              <p className={`text-[10px] sm:text-xs font-medium ${
                isPositive 
                  ? 'text-blue-600 dark:text-blue-500' 
                  : 'text-orange-600 dark:text-orange-500'
              }`}>
                {isPositive ? 'Surplus' : 'Deficit'}
              </p>
            </div>
          </div>
        </div>
      </Card>
      </div>
    </div>
  );
}
