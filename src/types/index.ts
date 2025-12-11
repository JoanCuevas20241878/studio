import type { Timestamp } from 'firebase/firestore';

export type UserProfile = {
  uid: string;
  name: string;
  email: string;
  createdAt: Timestamp;
};

export type Budget = {
  id: string; // YYYY-MM
  userId: string;
  month: string; // YYYY-MM
  limit: number;
};

export type Expense = {
  id?: string;
  userId: string;
  amount: number;
  category: 'Food' | 'Transport' | 'Clothing' | 'Home' | 'Other';
  note: string;
  date: Timestamp;
};
