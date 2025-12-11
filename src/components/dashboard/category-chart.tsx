'use client';

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMemo } from 'react';
import { EXPENSE_CATEGORIES } from '@/lib/constants';
import { useLocale } from '@/hooks/use-locale';

type CategoryChartProps = {
  data: { [key: string]: number };
};

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-background p-2 shadow-sm">
        <p className="text-sm font-bold">{`${payload[0].name}`}</p>
        <p className="text-sm text-muted-foreground">{`$${payload[0].value.toFixed(2)} (${payload[0].payload.percent.toFixed(0)}%)`}</p>
      </div>
    );
  }
  return null;
};

export function CategoryChart({ data }: CategoryChartProps) {
  const { t } = useLocale();

  const chartData = useMemo(() => {
    const total = Object.values(data).reduce((sum, value) => sum + value, 0);
    if (total === 0) return [];
    return Object.entries(data).map(([name, value]) => ({
      name: EXPENSE_CATEGORIES(t).find(c => c.value === name)?.label || name,
      value,
      percent: (value / total) * 100,
    })).sort((a, b) => b.value - a.value);
  }, [data, t]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.expensesByCategory}</CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <div className="w-full h-[250px]">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  stroke="hsl(var(--background))"
                  strokeWidth={2}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend iconSize={10} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex h-[250px] flex-col items-center justify-center text-center">
            <p className="text-lg font-medium">{t.noExpensesYet}</p>
            <p className="text-sm text-muted-foreground">{t.addExpensesToSeeBreakdown}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
