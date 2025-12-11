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
import { doc } from 'firebase/firestore';
import { useFirestore, useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useLocale } from '@/hooks/use-locale';

type RecentExpensesProps = {
  expenses: Expense[];
  onEdit: (expense: Expense) => void;
};

export function RecentExpenses({ expenses, onEdit }: RecentExpensesProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  const { t } = useLocale();
  
  const handleDelete = async (expenseId: string) => {
    if (!expenseId || !user) return;
    try {
      const expenseRef = doc(firestore, 'users', user.uid, 'expenses', expenseId);
      deleteDocumentNonBlocking(expenseRef);
      toast({ title: t.expenseDeleted });
    } catch (error) {
      toast({ variant: 'destructive', title: t.errorDeletingExpense });
    }
  };

  const CategoryIcon = ({ category }: { category: Expense['category'] }) => {
    const categoryInfo = EXPENSE_CATEGORIES(t).find(c => c.value === category);
    if (!categoryInfo) return null;
    const Icon = categoryInfo.icon;
    return <Icon className="h-4 w-4 text-muted-foreground" />;
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.recentExpenses}</CardTitle>
        <CardDescription>{t.recentExpensesDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t.date}</TableHead>
              <TableHead className="hidden sm:table-cell">{t.category}</TableHead>
              <TableHead>{t.note}</TableHead>
              <TableHead className="text-right">{t.amount}</TableHead>
              <TableHead><span className="sr-only">{t.actions}</span></TableHead>
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
                      {t[expense.category.toLowerCase() as keyof typeof t] || expense.category}
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
                          <span className="sr-only">{t.actions}</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(expense)}>
                          <Pencil className="mr-2 h-4 w-4" /> {t.edit}
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(expense.id!)}>
                          <Trash2 className="mr-2 h-4 w-4" /> {t.delete}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  {t.noExpensesThisMonth}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
