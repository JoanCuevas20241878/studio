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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useUser, useFirestore } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { collection, doc, Timestamp } from 'firebase/firestore';
import { EXPENSE_CATEGORIES } from '@/lib/constants';
import type { Expense } from '@/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useEffect, useState } from 'react';
import { Loader } from './ui/loader';
import { addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useLocale } from '@/hooks/use-locale';

const getExpenseSchema = (t: any) => z.object({
  amount: z.coerce.number().positive({ message: t.amountPositiveError }),
  category: z.enum(['Food', 'Transport', 'Clothing', 'Home', 'Other'], { required_error: t.categoryRequiredError }),
  note: z.string().max(100, t.noteLengthError).optional(),
  date: z.date({ required_error: t.dateRequiredError }),
});


type ExpenseDialogProps = {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  expense?: Expense | null;
};

export function ExpenseDialog({ isOpen, setIsOpen, expense }: ExpenseDialogProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useLocale();

  const expenseSchema = getExpenseSchema(t);

  const form = useForm<z.infer<typeof expenseSchema>>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      amount: 0,
      note: '',
      date: new Date(),
    }
  });

  useEffect(() => {
    if (isOpen) {
      if (expense) {
        form.reset({
          amount: expense.amount,
          category: expense.category,
          note: expense.note || '',
          date: expense.date.toDate(),
        });
      } else {
        form.reset({
          amount: 0,
          category: undefined,
          note: '',
          date: new Date(),
        });
      }
    }
  }, [expense, form, isOpen]);

  const onSubmit = async (values: z.infer<typeof expenseSchema>) => {
    if (!user) {
      toast({ variant: 'destructive', title: t.mustBeLoggedIn });
      return;
    }
    setIsLoading(true);

    try {
      const expenseData = {
        userId: user.uid,
        amount: values.amount,
        category: values.category,
        note: values.note || '',
        date: Timestamp.fromDate(values.date),
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
      setIsLoading(false);
    }
  };

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
                    <Input type="number" placeholder="0.00" {...field} />
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
                  <FormLabel>{t.category}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
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
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>{t.pickADate}</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.noteOptional}</FormLabel>
                  <FormControl>
                    <Textarea placeholder={t.notePlaceholder} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>{t.cancel}</Button>
              <Button type="submit" disabled={isLoading}>
                 {isLoading && <Loader className="mr-2 h-4 w-4" />}
                {expense ? t.saveChanges : t.addExpense}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
