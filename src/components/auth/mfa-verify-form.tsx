'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader } from '../ui/loader';
import { useUser } from '@/firebase';
import {
  ConfirmationResult,
  PhoneAuthProvider,
  PhoneMultiFactorGenerator,
  multiFactor,
} from 'firebase/auth';
import { useRouter } from 'next/navigation';

const formSchema = z.object({
  verificationCode: z.string().length(6, { message: 'Code must be 6 digits' }),
});

type MfaVerifyFormProps = {
  confirmationResult: ConfirmationResult;
  phoneNumber: string | null;
};

export function MfaVerifyForm({ confirmationResult, phoneNumber }: MfaVerifyFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useUser();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { verificationCode: '' },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);

    if (!user) {
      toast({ variant: 'destructive', title: 'User not found' });
      setIsLoading(false);
      return;
    }

    try {
      const credential = PhoneAuthProvider.credential(
        confirmationResult.verificationId,
        values.verificationCode
      );

      const multiFactorAssertion = PhoneMultiFactorGenerator.assertion(credential);
      
      await multiFactor(user).enroll(multiFactorAssertion, phoneNumber);

      toast({ title: 'Success!', description: 'Two-factor authentication has been enabled.' });
      router.push('/dashboard');
      
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Verification Failed',
        description: error.message || 'The code you entered is invalid.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <div className="mb-6 flex flex-col space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Enter Verification Code</h1>
        <p className="text-sm text-muted-foreground">
          A 6-digit code was sent to {phoneNumber}.
        </p>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="verificationCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Verification Code</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="123456" maxLength={6} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button disabled={isLoading} className="w-full" type="submit">
            {isLoading && <Loader className="mr-2 h-4 w-4" />}
            Verify and Enable
          </Button>
        </form>
      </Form>
    </>
  );
}
