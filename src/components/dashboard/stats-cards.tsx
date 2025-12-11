'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, PiggyBank, Target } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useLocale } from '@/hooks/use-locale';

type StatsCardsProps = {
  totalSpent: number;
  remainingBudget: number | null;
  budgetLimit: number | undefined;
};

export function StatsCards({ totalSpent, remainingBudget, budgetLimit }: StatsCardsProps) {
  const { t } = useLocale();
  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) return t.notAvailable;
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };
  
  const progressValue = budgetLimit && budgetLimit > 0 ? (totalSpent / budgetLimit) * 100 : 0;

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t.totalSpentThisMonth}</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalSpent)}</div>
          {budgetLimit ? (
            <>
              <p className="text-xs text-muted-foreground">
                {t.of} {formatCurrency(budgetLimit)} {t.budget}
              </p>
              <Progress value={progressValue} className="mt-2 h-2" />
            </>
          ) : (
            <p className="text-xs text-muted-foreground">{t.noBudgetSet}</p>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t.remainingBudget}</CardTitle>
          <PiggyBank className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(remainingBudget)}</div>
          <p className="text-xs text-muted-foreground">
            {remainingBudget === null ? t.setBudgetToSee : (remainingBudget >= 0 ? t.withinBudget : t.overBudget)}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t.monthlyBudget}</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(budgetLimit)}</div>
          <p className="text-xs text-muted-foreground">{t.yourSpendingLimit}</p>
        </CardContent>
      </Card>
    </>
  );
}
