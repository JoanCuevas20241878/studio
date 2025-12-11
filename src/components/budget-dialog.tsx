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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useUser, useFirestore } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { doc } from 'firebase/firestore';
import type { Budget } from '@/types';
import { useEffect, useState } from 'react';
import { Loader } from './ui/loader';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useLocale } from '@/hooks/use-locale';

const getBudgetSchema = (t: any) => z.object({
  limit: z.coerce.number().positive({ message: t.budgetPositiveError }),
});

type BudgetDialogProps = {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  currentBudget: Budget | null;
};

export function BudgetDialog({ isOpen, setIsOpen, currentBudget }: BudgetDialogProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const { t, locale } = useLocale();
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

  const budgetSchema = getBudgetSchema(t);

  const form = useForm<z.infer<typeof budgetSchema>>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      limit: 0,
    }
  });

  useEffect(() => {
    if (isOpen) {
      if (currentBudget) {
        form.setValue('limit', currentBudget.limit);
      } else {
        form.reset({ limit: 0 });
      }
    }
  }, [currentBudget, form, isOpen]);

  const onSubmit = async (values: z.infer<typeof budgetSchema>) => {
    if (!user) {
      toast({ variant: 'destructive', title: t.mustBeLoggedIn });
      return;
    }
    setIsLoading(true);

    try {
      const budgetData: Budget = {
        id: `${user.uid}_${currentMonth}`,
        userId: user.uid,
        month: currentMonth,
        limit: values.limit,
      };

      const budgetRef = doc(firestore, 'users', user.uid, 'budgets', budgetData.id);
      setDocumentNonBlocking(budgetRef, budgetData, { merge: true });
      
      toast({ title: t.budgetSetSuccess });
      setIsOpen(false);
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: t.anErrorOccurred });
    } finally {
        setIsLoading(false);
    }
  };

  const monthName = new Date().toLocaleString(locale, { month: 'long', year: 'numeric' });

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t.setMonthlyBudget}</DialogTitle>
          <DialogDescription>
            {t.setSpendingLimitFor} {monthName}.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="limit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.budgetLimit}</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="1000.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>{t.cancel}</Button>
              <Button type="submit" disabled={isLoading}>
                 {isLoading && <Loader className="mr-2 h-4 w-4" />}
                {t.setBudget}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
