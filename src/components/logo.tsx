import { PiggyBank } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-2 text-lg font-bold text-primary', className)}>
      <PiggyBank className="h-6 w-6" />
      <h1 className="font-sans">SmartExpense AI</h1>
    </div>
  );
}
