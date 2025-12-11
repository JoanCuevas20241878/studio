'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import type { Expense } from '@/types';
import { EXPENSE_CATEGORIES } from '@/lib/constants';
import { deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useToast } from '@/hooks/use-toast';

type RecentExpensesProps = {
  expenses: Expense[];
  onEdit: (expense: Expense) => void;
};

export function RecentExpenses({ expenses, onEdit }: RecentExpensesProps) {
  const { toast } = useToast();
  
  const handleDelete = async (expenseId: string) => {
    if (!expenseId) return;
    try {
      await deleteDoc(doc(db, 'expenses', expenseId));
      toast({ title: "Expense deleted successfully." });
    } catch (error) {
      toast({ variant: 'destructive', title: "Error deleting expense." });
    }
  };

  const CategoryIcon = ({ category }: { category: Expense['category'] }) => {
    const categoryInfo = EXPENSE_CATEGORIES.find(c => c.value === category);
    if (!categoryInfo) return null;
    const Icon = categoryInfo.icon;
    return <Icon className="h-4 w-4 text-muted-foreground" />;
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Expenses</CardTitle>
        <CardDescription>A list of your most recent expenses this month.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead className="hidden sm:table-cell">Category</TableHead>
              <TableHead>Note</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.length > 0 ? (
              expenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell>{expense.date.toDate().toLocaleDateString()}</TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant="outline" className="flex items-center gap-1 w-fit">
                      <CategoryIcon category={expense.category} />
                      {expense.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium truncate max-w-xs">{expense.note}</TableCell>
                  <TableCell className="text-right">
                    ${expense.amount.toFixed(2)}
                  </TableCell>
                   <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(expense)}>
                          <Pencil className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(expense.id!)}>
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No expenses recorded for this month.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
