'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  collection,
  query,
  where,
  Timestamp,
  orderBy,
} from 'firebase/firestore';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import type { Expense, Budget } from '@/types';
import { Button } from '@/components/ui/button';
import { Download, Plus, Target } from 'lucide-react';
import { StatsCards } from './stats-cards';
import { CategoryChart } from './category-chart';
import { RecentExpenses } from './recent-expenses';
import { AISuggestions } from './ai-suggestions';
import { ExpenseDialog } from '../expense-dialog';
import { BudgetDialog } from '../budget-dialog';
import { Loader } from '../ui/loader';
import { exportToCsv, getLocalSavingsTips } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useLocale } from '@/hooks/use-locale';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function DashboardClient() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const { t } = useLocale();

  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
  const [isBudgetDialogOpen, setIsBudgetDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const currentMonth = useMemo(() => new Date().toISOString().slice(0, 7), []); // YYYY-MM

  const expensesQuery = useMemoFirebase(() => {
    if (!user) return null;
    const currentYear = new Date().getFullYear();
    const currentMonthIndex = new Date().getMonth();
    const startDate = new Date(currentYear, currentMonthIndex, 1);
    const endDate = new Date(currentYear, currentMonthIndex + 1, 0, 23, 59, 59);

    return query(
      collection(firestore, 'users', user.uid, 'expenses'),
      where('date', '>=', Timestamp.fromDate(startDate)),
      where('date', '<=', Timestamp.fromDate(endDate)),
      orderBy('date', 'desc')
    );
  }, [user, firestore]);

  const { data: expenses, isLoading: expensesLoading } = useCollection<Expense>(expensesQuery);

  const budgetQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(firestore, 'users', user.uid, 'budgets'),
      where('month', '==', currentMonth)
    );
  }, [user, firestore, currentMonth]);

  const { data: budgets, isLoading: budgetLoading } = useCollection<Budget>(budgetQuery);
  const budget = useMemo(() => (budgets && budgets.length > 0 ? budgets[0] : null), [budgets]);
  
  const loading = expensesLoading || budgetLoading;

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setIsExpenseDialogOpen(true);
  };
  
  const handleAddExpense = () => {
    setEditingExpense(null);
    setIsExpenseDialogOpen(true);
  };

  const { totalSpent, remainingBudget, expensesByCategory } = useMemo(() => {
    const safeExpenses = expenses || [];
    const totalSpent = safeExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const remainingBudget = budget ? budget.limit - totalSpent : null;
    const expensesByCategory = safeExpenses.reduce((acc, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
      return acc;
    }, {} as { [key: string]: number });

    return { totalSpent, remainingBudget, expensesByCategory };
  }, [expenses, budget]);
  
  const aiSuggestions = useMemo(() => {
    if (budget && expenses) {
      return getLocalSavingsTips({
        totalSpentThisMonth: totalSpent,
        monthlyBudgetLimit: budget.limit,
        expensesByCategory: expensesByCategory,
        t: t,
      });
    }
    return null;
  }, [totalSpent, budget, expenses, expensesByCategory, t]);


  const handleExport = useCallback(() => {
    if (!expenses || expenses.length === 0) {
      toast({
        title: t.noExpensesToExport,
        description: t.noExpensesThisMonthDesc,
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
  }, [expenses, currentMonth, toast, t]);

  if (loading) {
    return <div className="flex flex-1 items-center justify-center"><Loader className="h-10 w-10"/></div>
  }

  const addExpenseButton = (
    <Button onClick={handleAddExpense} disabled={!budget}>
      <Plus className="mr-2 h-4 w-4" /> {t.addExpense}
    </Button>
  );

  return (
    <>
      <div className="flex flex-col p-4 md:p-6 lg:p-8">
        <div className="mb-6 flex items-center justify-between">
            <div>
            <h1 className="text-3xl font-bold">{t.dashboard}</h1>
            <p className="text-muted-foreground">{t.dashboardDescription}</p>
            </div>
            <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleExport}><Download className="mr-2 h-4 w-4" /> {t.exportCsv}</Button>
            <Button variant="outline" onClick={() => setIsBudgetDialogOpen(true)}><Target className="mr-2 h-4 w-4" /> {t.setBudget}</Button>
            
            <TooltipProvider>
                <Tooltip>
                <TooltipTrigger asChild>
                    {/* We need this span wrapper for the tooltip to work when the button is disabled */}
                    <span tabIndex={!budget ? 0 : -1}> 
                    {addExpenseButton}
                    </span>
                </TooltipTrigger>
                {!budget && (
                    <TooltipContent>
                    <p>{t.setBudgetFirst}</p>
                    </TooltipContent>
                )}
                </Tooltip>
            </TooltipProvider>

            </div>
        </div>

        <div className="grid flex-1 gap-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatsCards totalSpent={totalSpent} remainingBudget={remainingBudget} budgetLimit={budget?.limit} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <CategoryChart data={expensesByCategory} />
                </div>
                <div className="lg:col-span-1">
                    <AISuggestions suggestions={aiSuggestions} />
                </div>
            </div>
            <div className="grid grid-cols-1 gap-6">
            <RecentExpenses expenses={expenses || []} onEdit={handleEditExpense} />
            </div>
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
