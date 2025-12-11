'use client';

import { useState, useMemo } from 'react';
import { collection, query, where, Timestamp, orderBy } from 'firebase/firestore';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import type { Expense } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar } from 'recharts';
import { useLocale } from '@/hooks/use-locale';
import { Loader } from '@/components/ui/loader';
import { DateRangePicker } from '@/components/analysis/date-range-picker';
import { subMonths, startOfMonth, endOfMonth, differenceInDays } from 'date-fns';
import { StatsCard } from '@/components/analysis/stats-card';
import { EXPENSE_CATEGORIES } from '@/lib/constants';

const CustomTooltip = ({ active, payload, label, t }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-background p-2 shadow-sm">
        <p className="text-sm font-bold">{label}</p>
        {payload.map((pld: any) => (
          <p key={pld.dataKey} style={{ color: pld.color }} className="text-sm">
            {pld.name}: ${pld.value.toFixed(2)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};


export default function AnalysisPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { t } = useLocale();

  const [dateRange, setDateRange] = useState({
    current: { from: startOfMonth(new Date()), to: endOfMonth(new Date()) },
    compare: { from: startOfMonth(subMonths(new Date(), 1)), to: endOfMonth(subMonths(new Date(), 1)) },
  });

  const allTimeQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, 'users', user.uid, 'expenses'), orderBy('date', 'desc'));
  }, [user, firestore]);

  const { data: allExpenses, isLoading } = useCollection<Expense>(allTimeQuery);

  const processData = (expenses: Expense[], range: { from: Date, to: Date }) => {
    const filtered = expenses.filter(exp => {
      const expDate = exp.date.toDate();
      return expDate >= range.from && expDate <= range.to;
    });

    const totalSpent = filtered.reduce((sum, exp) => sum + exp.amount, 0);
    const byCategory = filtered.reduce((acc, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
      return acc;
    }, {} as { [key: string]: number });
    
    const days = differenceInDays(range.to, range.from) + 1;
    const avgDailySpend = totalSpent / (days > 0 ? days : 1);

    return { totalSpent, byCategory, avgDailySpend };
  };

  const { currentData, compareData, chartData } = useMemo(() => {
    const safeExpenses = allExpenses || [];
    const current = processData(safeExpenses, dateRange.current);
    const compare = processData(safeExpenses, dateRange.compare);
    
    const categories = EXPENSE_CATEGORIES(t).map(c => c.value);
    const cData = categories.map(category => ({
      name: t[category.toLowerCase() as keyof typeof t] || category,
      current: current.byCategory[category] || 0,
      compare: compare.byCategory[category] || 0,
    }));

    return { currentData: current, compareData: compare, chartData: cData };
  }, [allExpenses, dateRange, t]);

  const totalSpentChange = useMemo(() => {
    if (compareData.totalSpent === 0) return currentData.totalSpent > 0 ? 100 : 0;
    return ((currentData.totalSpent - compareData.totalSpent) / compareData.totalSpent) * 100;
  }, [currentData.totalSpent, compareData.totalSpent]);

  const avgSpendChange = useMemo(() => {
    if (compareData.avgDailySpend === 0) return currentData.avgDailySpend > 0 ? 100 : 0;
    return ((currentData.avgDailySpend - compareData.avgDailySpend) / compareData.avgDailySpend) * 100;
  }, [currentData.avgDailySpend, compareData.avgDailySpend]);


  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 lg:p-8">
      <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold">{t.analysis}</h1>
          <p className="text-muted-foreground">{t.analysisDescription}</p>
        </div>
        <DateRangePicker 
          range={dateRange} 
          onRangeChange={setDateRange} 
          t={t}
        />
      </div>

      {isLoading ? (
        <div className="flex h-[50vh] w-full items-center justify-center">
            <Loader className="h-10 w-10" />
        </div>
      ) : (
        <div className="grid gap-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard title={t.totalSpent} value={currentData.totalSpent} change={totalSpentChange} t={t} isCurrency />
                <StatsCard title={t.avgDailySpend} value={currentData.avgDailySpend} change={avgSpendChange} t={t} isCurrency />
                <StatsCard title={t.compareTotalSpent} value={compareData.totalSpent} t={t} isCurrency />
                <StatsCard title={t.compareAvgDailySpend} value={compareData.avgDailySpend} t={t} isCurrency />
            </div>

            <Card>
                <CardHeader>
                <CardTitle>{t.expensesByCategory}</CardTitle>
                <CardDescription>{t.categorySpendComparison}</CardDescription>
                </CardHeader>
                <CardContent>
                {chartData.some(d => d.current > 0 || d.compare > 0) ? (
                    <div className="w-full h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(value) => `$${value}`} />
                            <Tooltip content={<CustomTooltip t={t} />} />
                            <Legend />
                            <Bar dataKey="current" name={t.currentPeriod} fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="compare" name={t.comparePeriod} fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="flex h-[350px] w-full items-center justify-center">
                        <p className="text-muted-foreground">{t.noDataForChart}</p>
                    </div>
                )}
                </CardContent>
            </Card>
        </div>
      )}
    </div>
  );
}
