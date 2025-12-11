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
import { useEffect, useState, useRef } from 'react';
import { Loader } from './ui/loader';
import { addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useLocale } from '@/hooks/use-locale';
import { ImageUpload } from './image-upload';
import { extractExpenseFromImage } from '@/ai/flows/extract-expense-from-image-flow';
import { Separator } from './ui/separator';
import { Upload } from 'lucide-react';


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
  const [isExtracting, setIsExtracting] = useState(false);
  const { t } = useLocale();
  const imageUploadRef = useRef<{ openFileDialog: () => void }>(null);


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
    }
  }, [expense, form, isOpen]);
  
  const handleImageUpload = async (file: File) => {
    setIsExtracting(true);
    try {
        const formData = new FormData();
        formData.append('receipt', file);
        
        const extractedData = await extractExpenseFromImage({ receipt: file });

        if (extractedData) {
            form.setValue('amount', extractedData.amount, { shouldValidate: true });
            form.setValue('note', extractedData.note, { shouldValidate: true });
            form.setValue('date', extractedData.date, { shouldValidate: true });
            if (extractedData.category) {
              form.setValue('category', extractedData.category, { shouldValidate: true });
            }
            toast({ title: t.dataExtractedSuccess });
        }
    } catch (error) {
        console.error("Failed to extract data from image", error);
        toast({ variant: 'destructive', title: t.dataExtractedError });
    } finally {
        setIsExtracting(false);
    }
  };


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

  const isLoading = isSubmitting || isExtracting;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{expense ? t.editExpense : t.addExpense}</DialogTitle>
          <DialogDescription>
            {expense ? t.editExpenseDescription : t.addExpenseDescription}
          </DialogDescription>
        </DialogHeader>

        <ImageUpload ref={imageUploadRef} onImageSelect={handleImageUpload} />
        <Button variant="outline" onClick={() => imageUploadRef.current?.openFileDialog()} disabled={isLoading}>
          {isExtracting ? <Loader className="mr-2" /> : <Upload className="mr-2" />}
          {isExtracting ? t.extractingData : t.addFromImage}
        </Button>

        <div className="flex items-center space-x-2">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground">{t.orEnterManually}</span>
            <Separator className="flex-1" />
        </div>

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
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.category}</FormLabel>
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
            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.noteOptional}</FormLabel>
                  <FormControl>
                    <Textarea placeholder={t.notePlaceholder} {...field} value={field.value ?? ''} disabled={isLoading} />
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
