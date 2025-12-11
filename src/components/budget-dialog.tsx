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

const budgetSchema = z.object({
  limit: z.coerce.number().positive({ message: 'Budget limit must be greater than 0.' }),
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
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

  const form = useForm<z.infer<typeof budgetSchema>>({
    resolver: zodResolver(budgetSchema),
  });

  useEffect(() => {
    if (currentBudget) {
      form.setValue('limit', currentBudget.limit);
    } else {
      form.reset({ limit: undefined });
    }
  }, [currentBudget, form, isOpen]);

  const onSubmit = async (values: z.infer<typeof budgetSchema>) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'You must be logged in.' });
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
      
      toast({ title: 'Budget set successfully!' });
      setIsOpen(false);
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'An error occurred.' });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Set Monthly Budget</DialogTitle>
          <DialogDescription>
            Set your spending limit for {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="limit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Budget Limit</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="1000.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isLoading}>
                 {isLoading && <Loader className="mr-2 h-4 w-4" />}
                Set Budget
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
