'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  Timestamp,
  orderBy,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/hooks/use-auth';
import type { Expense, Budget } from '@/types';
import { generatePersonalizedSavingsTips } from '@/ai/flows/generate-personalized-savings-tips';
import { Button } from '@/components/ui/button';
import { Download, Plus, Target } from 'lucide-react';
import { StatsCards } from './stats-cards';
import { CategoryChart } from './category-chart';
import { RecentExpenses } from './recent-expenses';
import { AISuggestions } from './ai-suggestions';
import { ExpenseDialog } from '../expense-dialog';
import { BudgetDialog } from '../budget-dialog';
import { Loader } from '../ui/loader';
import { exportToCsv } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export function DashboardClient() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budget, setBudget] = useState<Budget | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiSuggestions, setAiSuggestions] = useState<{
    alerts: string[];
    recommendations: string[];
  } | null>(null);
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
  const [isBudgetDialogOpen, setIsBudgetDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const currentMonth = useMemo(() => new Date().toISOString().slice(0, 7), []); // YYYY-MM

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setIsExpenseDialogOpen(true);
  };
  
  const handleAddExpense = () => {
    setEditingExpense(null);
    setIsExpenseDialogOpen(true);
  };

  useEffect(() => {
    if (!user) return;

    setLoading(true);
    const startOfMonth = Timestamp.fromDate(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
    const endOfMonth = Timestamp.fromDate(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59));

    const expensesQuery = query(
      collection(db, 'expenses'),
      where('userId', '==', user.uid),
      where('date', '>=', startOfMonth),
      where('date', '<=', endOfMonth),
      orderBy('date', 'desc')
    );

    const budgetQuery = query(
      collection(db, 'budgets'),
      where('userId', '==', user.uid),
      where('month', '==', currentMonth)
    );

    const unsubscribeExpenses = onSnapshot(expensesQuery, (snapshot) => {
      const userExpenses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Expense[];
      setExpenses(userExpenses);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching expenses:", error);
      setLoading(false);
    });

    const unsubscribeBudget = onSnapshot(budgetQuery, (snapshot) => {
      if (!snapshot.empty) {
        setBudget(snapshot.docs[0].data() as Budget);
      } else {
        setBudget(null);
      }
    }, (error) => {
      console.error("Error fetching budget:", error);
    });

    return () => {
      unsubscribeExpenses();
      unsubscribeBudget();
    };
  }, [user, currentMonth]);

  const { totalSpent, remainingBudget, expensesByCategory } = useMemo(() => {
    const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const remainingBudget = budget ? budget.limit - totalSpent : null;
    const expensesByCategory = expenses.reduce((acc, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
      return acc;
    }, {} as { [key: string]: number });

    return { totalSpent, remainingBudget, expensesByCategory };
  }, [expenses, budget]);

  useEffect(() => {
    const getSuggestions = async () => {
      if (!user || expenses.length === 0 || !budget) return;
      try {
        const result = await generatePersonalizedSavingsTips({
          userId: user.uid,
          totalSpentThisMonth: totalSpent,
          monthlyBudgetLimit: budget.limit,
          expensesByCategory: expensesByCategory,
          previousMonthTotalSpent: 0, // Simplified for now
        });
        setAiSuggestions(result);
      } catch (error) {
        console.error("Error generating AI suggestions:", error);
      }
    };
    
    const debounce = setTimeout(getSuggestions, 1000);
    return () => clearTimeout(debounce);

  }, [user, expenses, budget, totalSpent, expensesByCategory]);

  const handleExport = useCallback(() => {
    if (expenses.length === 0) {
      toast({
        title: "No expenses to export",
        description: "There are no expenses in the current month.",
      });
      return;
    }
    const dataToExport = expenses.map(e => ({
      date: e.date.toDate().toLocaleDateString(),
      category: e.category,
      amount: e.amount,
      note: e.note,
    }));
    exportToCsv(`smart-expense-${currentMonth}.csv`, dataToExport);
  }, [expenses, currentMonth, toast]);

  if (loading) {
    return <div className="flex flex-1 items-center justify-center"><Loader className="h-10 w-10"/></div>
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here&apos;s your financial overview for the month.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExport}><Download className="mr-2 h-4 w-4" /> Export CSV</Button>
          <Button variant="outline" onClick={() => setIsBudgetDialogOpen(true)}><Target className="mr-2 h-4 w-4" /> Set Budget</Button>
          <Button onClick={handleAddExpense}><Plus className="mr-2 h-4 w-4" /> Add Expense</Button>
        </div>
      </div>

      <div className="flex-1 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <StatsCards totalSpent={totalSpent} remainingBudget={remainingBudget} budgetLimit={budget?.limit} />
        
        <div className="md:col-span-2 lg:col-span-1">
          <CategoryChart data={expensesByCategory} />
        </div>

        <div className="lg:col-span-3">
          <AISuggestions suggestions={aiSuggestions} />
        </div>
        
        <div className="md:col-span-2 lg:col-span-3">
          <RecentExpenses expenses={expenses} onEdit={handleEditExpense} />
        </div>
      </div>
      
      <ExpenseDialog 
        isOpen={isExpenseDialogOpen} 
        setIsOpen={setIsExpenseDialogOpen}
        expense={editingExpense}
      />
      <BudgetDialog 
        isOpen={isBudgetDialogOpen} 
        setIsOpen={setIsBudgetDialogOpen} 
        currentBudget={budget} 
      />
    </>
  );
}
