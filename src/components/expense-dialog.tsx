'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useUser, useFirestore } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { collection, doc, Timestamp } from 'firebase/firestore';
import { EXPENSE_CATEGORIES } from '@/lib/constants';
import type { Expense } from '@/types';
import { useEffect, useState, useCallback } from 'react';
import { Loader } from './ui/loader';
import { addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useLocale } from '@/hooks/use-locale';
import { debounce } from '@/lib/utils';
import { suggestCategory } from '@/ai/flows/suggest-category-flow';
import { Lightbulb } from 'lucide-react';


const getExpenseSchema = (t: any) => {
  return z.object({
    amount: z.coerce.number().positive({ message: t.amountPositiveError }),
    category: z.enum(['Food', 'Transport', 'Clothing', 'Home', 'Other'], { required_error: t.categoryRequiredError }),
    note: z.string().max(100, t.noteLengthError).optional(),
    date: z.string()
      .refine((val) => !isNaN(Date.parse(val)), { message: t.dateRequiredError }),
  });
};

type ExpenseDialogProps = {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  expense?: Expense | null;
};

// Helper function to format a Date or Timestamp to 'yyyy-MM-dd'
const formatDateForInput = (date: Date | Timestamp | undefined): string => {
  if (!date) return new Date().toISOString().split('T')[0];
  const d = date instanceof Timestamp ? date.toDate() : date;
  // Adjust for timezone offset before converting to ISO string
  const timezoneOffset = d.getTimezoneOffset() * 60000;
  const adjustedDate = new Date(d.getTime() - timezoneOffset);
  return adjustedDate.toISOString().split('T')[0];
};

export function ExpenseDialog({ isOpen, setIsOpen, expense }: ExpenseDialogProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const { t } = useLocale();

  const expenseSchema = getExpenseSchema(t);

  const form = useForm<z.infer<typeof expenseSchema>>({
    resolver: zodResolver(expenseSchema),
    mode: 'onChange',
    defaultValues: {
      amount: 0,
      note: '',
      date: formatDateForInput(new Date()),
    }
  });

  useEffect(() => {
    if (isOpen) {
      if (expense) {
        form.reset({
          amount: expense.amount,
          category: expense.category,
          note: expense.note || '',
          date: formatDateForInput(expense.date),
        });
      } else {
        form.reset({
          amount: 0,
          category: undefined,
          note: '',
          date: formatDateForInput(new Date()),
        });
      }
      setIsSuggesting(false);
    }
  }, [expense, form, isOpen]);
  
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSuggestCategory = useCallback(
    debounce(async (note: string) => {
      if (note.trim().length < 5) {
        setIsSuggesting(false);
        return;
      }
      setIsSuggesting(true);
      try {
        const { category } = await suggestCategory({ note });
        form.setValue('category', category, { shouldValidate: true });
      } catch (error) {
        console.error("Error suggesting category:", error);
      } finally {
        setIsSuggesting(false);
      }
    }, 1000),
    [form]
  );

  const onSubmit = async (values: z.infer<typeof expenseSchema>) => {
    if (!user) {
      toast({ variant: 'destructive', title: t.mustBeLoggedIn });
      return;
    }
    setIsSubmitting(true);

    try {
      const selectedDate = new Date(values.date);
      // To ensure the date is stored correctly regardless of user's timezone,
      // create a "naive" date at midnight UTC corresponding to the user's selected day.
      const utcDate = new Date(Date.UTC(selectedDate.getUTCFullYear(), selectedDate.getUTCMonth(), selectedDate.getUTCDate()));

      const expenseData = {
        userId: user.uid,
        amount: values.amount,
        category: values.category,
        note: values.note || '',
        date: Timestamp.fromDate(utcDate),
      };

      if (expense && expense.id) {
        // Update existing expense
        const expenseRef = doc(firestore, 'users', user.uid, 'expenses', expense.id);
        updateDocumentNonBlocking(expenseRef, expenseData);
        toast({ title: t.expenseUpdated });
      } else {
        // Add new expense
        const expensesColRef = collection(firestore, 'users', user.uid, 'expenses');
        addDocumentNonBlocking(expensesColRef, expenseData);
        toast({ title: t.expenseAdded });
      }

      setIsOpen(false);
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: t.anErrorOccurred });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = isSubmitting;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{expense ? t.editExpense : t.addExpense}</DialogTitle>
          <DialogDescription>
            {expense ? t.editExpenseDescription : t.addExpenseDescription}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.amount}</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0.00" {...field} disabled={isLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.note}</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder={t.notePlaceholder} 
                      {...field}
                      value={field.value ?? ''} 
                      disabled={isLoading}
                      onChange={(e) => {
                        field.onChange(e);
                        debouncedSuggestCategory(e.target.value);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    {t.category}
                    {isSuggesting && <Loader className="h-3 w-3" />}
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={isLoading}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t.selectCategory} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {EXPENSE_CATEGORIES(t).map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          <div className="flex items-center gap-2">
                            <cat.icon className="h-4 w-4" />
                            {cat.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>{t.date}</FormLabel>
                   <FormControl>
                      <Input type="date" {...field} disabled={isLoading} />
                    </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>{t.cancel}</Button>
              <Button type="submit" disabled={isLoading}>
                 {isSubmitting && <Loader className="mr-2 h-4 w-4" />}
                {expense ? t.saveChanges : t.addExpense}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
