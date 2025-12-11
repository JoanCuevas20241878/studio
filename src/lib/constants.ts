import { Car, Home, Shirt, Utensils, PiggyBank } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type ExpenseCategory = {
  value: 'Food' | 'Transport' | 'Clothing' | 'Home' | 'Other';
  label: string;
  icon: LucideIcon;
};

export const EXPENSE_CATEGORIES = (t: any): ExpenseCategory[] => [
  { value: 'Food', label: t.food, icon: Utensils },
  { value: 'Transport', label: t.transport, icon: Car },
  { value: 'Clothing', label: t.clothing, icon: Shirt },
  { value: 'Home', label: t.home, icon: Home },
  { value: 'Other', label: t.other, icon: PiggyBank },
];
