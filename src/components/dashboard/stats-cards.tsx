'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, PiggyBank, Target } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

type StatsCardsProps = {
  totalSpent: number;
  remainingBudget: number | null;
  budgetLimit: number | undefined;
};

export function StatsCards({ totalSpent, remainingBudget, budgetLimit }: StatsCardsProps) {
  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) return 'N/A';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };
  
  const progressValue = budgetLimit && budgetLimit > 0 ? (totalSpent / budgetLimit) * 100 : 0;

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Spent (This Month)</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalSpent)}</div>
          {budgetLimit ? (
            <>
              <p className="text-xs text-muted-foreground">
                of {formatCurrency(budgetLimit)} budget
              </p>
              <Progress value={progressValue} className="mt-2 h-2" />
            </>
          ) : (
            <p className="text-xs text-muted-foreground">No budget set for this month</p>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Remaining Budget</CardTitle>
          <PiggyBank className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(remainingBudget)}</div>
          <p className="text-xs text-muted-foreground">
            {remainingBudget === null ? 'Set a budget to see this' : (remainingBudget >= 0 ? 'You are within budget' : 'You are over budget')}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Monthly Budget</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(budgetLimit)}</div>
          <p className="text-xs text-muted-foreground">Your spending limit for the month</p>
        </CardContent>
      </Card>
    </>
  );
}
