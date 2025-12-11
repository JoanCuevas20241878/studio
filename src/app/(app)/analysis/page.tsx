'use client';

import { useMemo } from 'react';
import { collection, query, where, Timestamp, orderBy } from 'firebase/firestore';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import type { Expense } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line } from 'recharts';
import { useLocale } from '@/hooks/use-locale';
import { Loader } from '@/components/ui/loader';

const CustomTooltip = ({ active, payload, label, t }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-background p-2 shadow-sm">
        <p className="text-sm font-bold">{label}</p>
        <p className="text-sm text-primary">{`${t.total}: $${payload[0].value.toFixed(2)}`}</p>
      </div>
    );
  }
  return null;
};


export default function AnalysisPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { t, locale } = useLocale();

  const expensesQuery = useMemoFirebase(() => {
    if (!user) return null;
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const startDate = new Date(sixMonthsAgo.getFullYear(), sixMonthsAgo.getMonth(), 1);

    return query(
      collection(firestore, 'users', user.uid, 'expenses'),
      where('date', '>=', Timestamp.fromDate(startDate)),
      orderBy('date', 'asc')
    );
  }, [user, firestore]);

  const { data: expenses, isLoading } = useCollection<Expense>(expensesQuery);

  const monthlyData = useMemo(() => {
    const today = new Date();
    const monthNames = Array.from({ length: 12 }, (_, i) =>
      new Date(0, i).toLocaleString(locale, { month: 'short' })
    );

    // Initialize the last 6 months with 0 total
    const lastSixMonthsData: { [key: string]: { name: string; total: number } } = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const month = d.getMonth();
      const year = d.getFullYear();
      const key = `${year}-${String(month).padStart(2, '0')}`;
      lastSixMonthsData[key] = { name: `${monthNames[month]} ${String(year).slice(-2)}`, total: 0 };
    }

    if (expenses) {
      expenses.forEach((expense) => {
        const date = expense.date.toDate();
        const month = date.getMonth();
        const year = date.getFullYear();
        const key = `${year}-${String(month).padStart(2, '0')}`;
        if (lastSixMonthsData[key]) {
          lastSixMonthsData[key].total += expense.amount;
        }
      });
    }

    return Object.values(lastSixMonthsData);
  }, [expenses, locale]);

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{t.analysis}</h1>
        <p className="text-muted-foreground">{t.analysisDescription}</p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>{t.spendingTrend}</CardTitle>
          <CardDescription>{t.spendingTrendDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-[350px] w-full items-center justify-center">
              <Loader className="h-10 w-10" />
            </div>
          ) : monthlyData.length > 0 ? (
            <div className="w-full h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={monthlyData}
                  margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(value) => `$${value}`} />
                  <Tooltip content={<CustomTooltip t={t} />} />
                  <Legend />
                  <Line type="monotone" dataKey="total" name={t.totalSpent} stroke="hsl(var(--primary))" strokeWidth={2} activeDot={{ r: 8 }} />
                </LineChart>
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
  );
}
