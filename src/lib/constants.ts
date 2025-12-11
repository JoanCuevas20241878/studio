import { Car, Home, Shirt, Utensils } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type ExpenseCategory = {
  value: 'Food' | 'Transport' | 'Clothing' | 'Home' | 'Other';
  label: string;
  icon: LucideIcon;
};

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  { value: 'Food', label: 'Food', icon: Utensils },
  { value: 'Transport', label: 'Transport', icon: Car },
  { value: 'Clothing', label: 'Clothing', icon: Shirt },
  { value: 'Home', label: 'Home', icon: Home },
  { value: 'Other', label: 'Other', icon: PiggyBank },
];

// Re-exporting an icon that is not directly used in the array
import { PiggyBank } from 'lucide-react';
