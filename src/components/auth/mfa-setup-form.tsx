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
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader } from '../ui/loader';
import { useAuth, useUser } from '@/firebase';
import {
  RecaptchaVerifier,
  ConfirmationResult,
  PhoneAuthProvider,
} from 'firebase/auth';
import 'react-phone-number-input/style.css';
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';

declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier;
  }
}

const formSchema = z.object({
  phoneNumber: z.string().refine(isValidPhoneNumber, { message: 'Invalid phone number' }),
});

type MfaSetupFormProps = {
  onVerificationSent: (confirmationResult: ConfirmationResult, phoneNumber: string) => void;
};

export function MfaSetupForm({ onVerificationSent }: MfaSetupFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const auth = useAuth();
  const { user } = useUser();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { phoneNumber: '' },
  });

  const setupRecaptcha = () => {
    if (!auth || window.recaptchaVerifier) return window.recaptchaVerifier;
    
    window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      size: 'invisible',
      callback: () => {
        // reCAPTCHA solved, allow signInWithPhoneNumber.
      },
    });
    return window.recaptchaVerifier;
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    if (!auth || !user) {
      toast({ variant: 'destructive', title: 'You must be logged in' });
      setIsLoading(false);
      return;
    }

    try {
      const appVerifier = setupRecaptcha()!;
      const phoneProvider = new PhoneAuthProvider(auth);
      
      const confirmationResult = await phoneProvider.verifyPhoneNumber(
        values.phoneNumber,
        appVerifier
      );
      
      toast({ title: 'Verification code sent!', description: 'Check your phone for a text message.' });
      onVerificationSent(confirmationResult, values.phoneNumber);

    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'MFA Setup Failed',
        description: error.message || 'Could not send verification code.',
      });
      // Reset reCAPTCHA if it fails
       if (window.recaptchaVerifier) {
        window.recaptchaVerifier.render().then(widgetId => {
          // @ts-ignore
          window.grecaptcha.reset(widgetId);
        });
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <div className="mb-6 flex flex-col space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Secure Your Account</h1>
        <p className="text-sm text-muted-foreground">
          Add an extra layer of security with two-factor authentication.
        </p>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="phoneNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <PhoneInput
                    {...field}
                    placeholder="Enter phone number"
                    international
                    defaultCountry="US"
                    className="input"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button disabled={isLoading} className="w-full" type="submit">
            {isLoading && <Loader className="mr-2 h-4 w-4" />}
            Send Verification Code
          </Button>
        </form>
      </Form>
      <div id="recaptcha-container" className="mt-4"></div>
    </>
  );
}
