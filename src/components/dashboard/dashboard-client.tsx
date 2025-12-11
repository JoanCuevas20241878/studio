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
import { ExpenseDialog } from '../expense-dialog';
import { BudgetDialog } from '../budget-dialog';
import { Loader } from '../ui/loader';
import { exportToCsv } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useLocale } from '@/hooks/use-locale';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AISuggestions } from './ai-suggestions';
import { generatePersonalizedSavingsTips } from '@/ai/flows/generate-personalized-savings-tips';


export function DashboardClient() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const { t, locale } = useLocale();

  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
  const [isBudgetDialogOpen, setIsBudgetDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [suggestions, setSuggestions] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const currentMonth = useMemo(() => new Date().toISOString().slice(0, 7), []); // YYYY-MM

  const expensesQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(firestore, 'users', user.uid, 'expenses'),
      orderBy('date', 'desc')
    );
  }, [user, firestore]);

  const { data: allExpenses, isLoading: expensesLoading } = useCollection<Expense>(expensesQuery);

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
  
  const { monthlyExpenses, totalSpent, remainingBudget, expensesByCategory } = useMemo(() => {
    const safeExpenses = allExpenses || [];
    const currentYear = new Date().getFullYear();
    const currentMonthIndex = new Date().getMonth();
    
    const monthly = safeExpenses.filter(exp => {
        const expDate = exp.date.toDate();
        return expDate.getFullYear() === currentYear && expDate.getMonth() === currentMonthIndex;
    });
    
    const total = monthly.reduce((sum, exp) => sum + exp.amount, 0);
    const remaining = budget ? budget.limit - total : null;
    const byCategory = monthly.reduce((acc, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
      return acc;
    }, {} as { [key: string]: number });

    return { monthlyExpenses: monthly, totalSpent: total, remainingBudget: remaining, expensesByCategory: byCategory };
  }, [allExpenses, budget]);


  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setIsExpenseDialogOpen(true);
  };
  
  const handleAddExpense = () => {
    setEditingExpense(null);
    setIsExpenseDialogOpen(true);
  };

  const handleExport = useCallback(() => {
    if (!monthlyExpenses || monthlyExpenses.length === 0) {
      toast({
        title: t.noExpensesToExport,
        description: t.noExpensesThisMonthDesc,
      });
      return;
    }
    const dataToExport = monthlyExpenses.map(e => ({
      date: e.date.toDate().toLocaleDateString(),
      category: e.category,
      amount: e.amount,
      note: e.note,
    }));
    exportToCsv(`smart-expense-${currentMonth}.csv`, dataToExport);
  }, [monthlyExpenses, currentMonth, toast, t]);

  const handleGenerateSuggestions = async () => {
    setIsGenerating(true);
    try {
        const result = await generatePersonalizedSavingsTips({
            budget: budget!,
            expenses: monthlyExpenses,
            locale: locale,
        });
        setSuggestions(result);
    } catch (error) {
        console.error(error);
        toast({
            variant: 'destructive',
            title: t.anErrorOccurred,
            description: "Failed to generate AI suggestions."
        })
    } finally {
        setIsGenerating(false);
    }
  };

  if (loading) {
    return <div className="flex flex-1 items-center justify-center"><Loader className="h-10 w-10"/></div>
  }

  const addExpenseButton = (
    <Button onClick={handleAddExpense} disabled={!budget}>
      <Plus className="mr-2 h-4 w-4" /> {t.addExpense}
    </Button>
  );

  const canGenerate = !!budget && monthlyExpenses && monthlyExpenses.length > 0;

  return (
    <>
      <div className="flex items-center justify-between mb-6">
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

      <div className="flex-1 grid gap-6">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatsCards totalSpent={totalSpent} remainingBudget={remainingBudget} budgetLimit={budget?.limit} />
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
            <CategoryChart data={expensesByCategory} />
            <AISuggestions 
              suggestions={suggestions} 
              isLoading={isGenerating} 
              onGenerate={handleGenerateSuggestions}
              canGenerate={canGenerate}
            />
        </div>
        
        <div className="md:col-span-2 lg:col-span-3">
          <RecentExpenses expenses={monthlyExpenses || []} onEdit={handleEditExpense} />
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
