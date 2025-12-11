'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

type StatsCardProps = {
  title: string;
  value: number;
  change?: number;
  isCurrency?: boolean;
  t: any;
};

export function StatsCard({ title, value, change, isCurrency = false, t }: StatsCardProps) {
  const formatValue = (val: number) => {
    return isCurrency
      ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val)
      : val.toLocaleString();
  };

  const hasChange = typeof change === 'number' && isFinite(change);
  const isIncrease = hasChange && change > 0;
  const isDecrease = hasChange && change < 0;
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formatValue(value)}</div>
        {hasChange && (
          <div className="text-xs text-muted-foreground flex items-center">
            {isIncrease && <ArrowUpRight className="h-4 w-4 text-green-500" />}
            {isDecrease && <ArrowDownRight className="h-4 w-4 text-destructive" />}
            <span className={`font-semibold ${isIncrease ? 'text-green-500' : isDecrease ? 'text-destructive' : ''}`}>
              {Math.abs(change).toFixed(1)}%
            </span>
            <span className='ml-1'>{isIncrease ? t.increase : isDecrease ? t.decrease : ''} {t.vsLastPeriod}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
