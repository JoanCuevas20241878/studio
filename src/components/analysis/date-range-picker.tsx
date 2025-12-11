'use client';

import { useState } from 'react';
import { DateRange } from 'react-day-picker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format, subMonths, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';

type DateRangePreset = 'thisMonth' | 'lastMonth' | 'last3Months' | 'last6Months' | 'custom';

type DateRangePickerProps = {
  range: {
    current: { from: Date; to: Date };
    compare: { from: Date; to: Date };
  };
  onRangeChange: (newRange: {
    current: { from: Date; to: Date };
    compare: { from: Date; to: Date };
  }) => void;
  t: any;
};

const getPresetRange = (preset: DateRangePreset): { from: Date, to: Date } => {
    const now = new Date();
    switch (preset) {
        case 'thisMonth':
            return { from: startOfMonth(now), to: endOfMonth(now) };
        case 'lastMonth':
            const lastMonthStart = startOfMonth(subMonths(now, 1));
            const lastMonthEnd = endOfMonth(subMonths(now, 1));
            return { from: lastMonthStart, to: lastMonthEnd };
        case 'last3Months':
            return { from: startOfMonth(subMonths(now, 2)), to: endOfMonth(now) };
        case 'last6Months':
            return { from: startOfMonth(subMonths(now, 5)), to: endOfMonth(now) };
        default:
            return { from: startOfMonth(now), to: endOfMonth(now) };
    }
}


export function DateRangePicker({ range, onRangeChange, t }: DateRangePickerProps) {
  const [currentPreset, setCurrentPreset] = useState<DateRangePreset>('thisMonth');
  const [comparePreset, setComparePreset] = useState<DateRangePreset>('lastMonth');

  const handlePresetChange = (type: 'current' | 'compare', preset: DateRangePreset) => {
    if (type === 'current') {
      setCurrentPreset(preset);
      if (preset !== 'custom') {
        const newCurrentRange = getPresetRange(preset);
        onRangeChange({ ...range, current: newCurrentRange });
      }
    } else {
      setComparePreset(preset);
       if (preset !== 'custom') {
        const newCompareRange = getPresetRange(preset);
        onRangeChange({ ...range, compare: newCompareRange });
      }
    }
  };
  
  const handleDateChange = (type: 'current' | 'compare', dateRange: DateRange | undefined) => {
    if (dateRange?.from && dateRange?.to) {
      if (type === 'current') {
        setCurrentPreset('custom');
        onRangeChange({...range, current: { from: dateRange.from, to: dateRange.to }})
      } else {
        setComparePreset('custom');
        onRangeChange({...range, compare: { from: dateRange.from, to: dateRange.to }})
      }
    }
  }

  const DatePicker = ({ type }: { type: 'current' | 'compare' }) => {
    const r = type === 'current' ? range.current : range.compare;
    const preset = type === 'current' ? currentPreset : comparePreset;

    return (
        <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-muted-foreground">
                {type === 'current' ? t.currentPeriodLabel : t.comparePeriodLabel}
            </label>
            <div className="flex gap-2">
                 <Select value={preset} onValueChange={(val: DateRangePreset) => handlePresetChange(type, val)}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder={t.selectPeriod} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="thisMonth">{t.thisMonth}</SelectItem>
                        <SelectItem value="lastMonth">{t.lastMonth}</SelectItem>
                        <SelectItem value="last3Months">{t.last3Months}</SelectItem>
                        <SelectItem value="last6Months">{t.last6Months}</SelectItem>
                        <SelectItem value="custom" disabled>{t.custom}</SelectItem>
                    </SelectContent>
                </Select>
                <Popover>
                    <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        className="w-[260px] justify-start text-left font-normal"
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {r.from ? (
                        r.to ? (
                            <>
                            {format(r.from, 'LLL dd, y')} - {format(r.to, 'LLL dd, y')}
                            </>
                        ) : (
                            format(r.from, 'LLL dd, y')
                        )
                        ) : (
                        <span>{t.pickADate}</span>
                        )}
                    </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={r.from}
                        selected={{ from: r.from, to: r.to }}
                        onSelect={(dateRange) => handleDateChange(type, dateRange)}
                        numberOfMonths={2}
                    />
                    </PopoverContent>
                </Popover>
            </div>
        </div>
    )
  }

  return (
    <div className="flex flex-col md:flex-row gap-4">
        <DatePicker type="current" />
        <DatePicker type="compare" />
    </div>
  );
}
