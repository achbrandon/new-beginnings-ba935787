import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, ArrowUpRight, ArrowDownRight } from "lucide-react";

interface TransactionsStatsSummaryProps {
  transactions: any[];
}

export function TransactionsStatsSummary({ transactions }: TransactionsStatsSummaryProps) {
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

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6 animate-fade-in">
      {/* Income Card */}
      <Card className="p-4 sm:p-5 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/10 border-green-200 dark:border-green-900/30 hover:shadow-md transition-all">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Income</p>
            </div>
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-700 dark:text-green-400 mt-2">
              {formatCurrency(stats.income)}
            </p>
            <div className="flex items-center gap-1 mt-2">
              <ArrowUpRight className="h-3 w-3 text-green-600 dark:text-green-500" />
              <p className="text-xs text-green-600 dark:text-green-500 font-medium">
                {transactions.filter(t => t.type === 'credit' || t.type === 'deposit').length} transactions
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Expenses Card */}
      <Card className="p-4 sm:p-5 bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/10 border-red-200 dark:border-red-900/30 hover:shadow-md transition-all">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <div className="h-8 w-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
              </div>
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Expenses</p>
            </div>
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-red-700 dark:text-red-400 mt-2">
              {formatCurrency(stats.expenses)}
            </p>
            <div className="flex items-center gap-1 mt-2">
              <ArrowDownRight className="h-3 w-3 text-red-600 dark:text-red-500" />
              <p className="text-xs text-red-600 dark:text-red-500 font-medium">
                {transactions.filter(t => t.type !== 'credit' && t.type !== 'deposit').length} transactions
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Net Change Card */}
      <Card className={`p-4 sm:p-5 ${
        isPositive 
          ? 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/10 border-blue-200 dark:border-blue-900/30' 
          : 'bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/10 border-orange-200 dark:border-orange-900/30'
      } hover:shadow-md transition-all`}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <div className={`h-8 w-8 rounded-full ${
                isPositive 
                  ? 'bg-blue-100 dark:bg-blue-900/30' 
                  : 'bg-orange-100 dark:bg-orange-900/30'
              } flex items-center justify-center`}>
                <DollarSign className={`h-4 w-4 ${
                  isPositive 
                    ? 'text-blue-600 dark:text-blue-400' 
                    : 'text-orange-600 dark:text-orange-400'
                }`} />
              </div>
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Net Change</p>
            </div>
            <p className={`text-xl sm:text-2xl lg:text-3xl font-bold mt-2 ${
              isPositive 
                ? 'text-blue-700 dark:text-blue-400' 
                : 'text-orange-700 dark:text-orange-400'
            }`}>
              {isPositive ? '+' : ''}{formatCurrency(netChange)}
            </p>
            <div className="flex items-center gap-1 mt-2">
              {isPositive ? (
                <TrendingUp className="h-3 w-3 text-blue-600 dark:text-blue-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-orange-600 dark:text-orange-500" />
              )}
              <p className={`text-xs font-medium ${
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
  );
}
