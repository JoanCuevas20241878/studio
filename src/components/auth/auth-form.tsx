'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { useAuth, useFirestore } from '@/firebase';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader } from '../ui/loader';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';

const baseSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email.' }),
  password: z
    .string()
    .min(6, { message: 'Password must be at least 6 characters.' }),
});

const loginSchema = baseSchema;

const signupSchema = baseSchema
  .extend({
    name: z.string().min(1, { message: 'Name is required.' }),
    confirmPassword: z.string(),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type AuthFormProps = {
  mode: 'login' | 'signup';
};

const GoogleIcon = () => (
    <svg className="mr-2 h-4 w-4" viewBox="0 0 48 48">
        <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039L38.802 9.92C34.553 6.184 29.658 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
        <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.841-5.841C34.553 6.184 29.658 4 24 4C16.318 4 9.656 8.337 6.306 14.691z" />
        <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.222 0-9.612-3.243-11.284-7.614l-6.571 4.819C9.656 40.663 16.318 44 24 44z" />
g:fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.022 35.242 44 30.036 44 24c0-1.341-.138-2.65-.389-3.917z" />
    </svg>
);

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  const auth = useAuth();
  const firestore = useFirestore();

  const formSchema = mode === 'signup' ? signupSchema : loginSchema;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: 'onChange', // Validate fields as user types
    defaultValues:
      mode === 'signup'
        ? {
            name: '',
            email: '',
            password: '',
            confirmPassword: '',
          }
        : {
            email: '',
            password: '',
          },
  });

  async function handleGoogleSignIn() {
    setIsLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userDocRef = doc(firestore, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        // New user, create a profile document
        const userData = {
          uid: user.uid,
          id: user.uid,
          name: user.displayName || 'Google User',
          email: user.email!,
          createdAt: Timestamp.now(),
        };
        // Use non-blocking write for performance
        setDocumentNonBlocking(userDocRef, userData, { merge: true });
        toast({ title: 'Account created successfully with Google!' });
      } else {
        toast({ title: 'Logged in successfully with Google!' });
      }

      router.push('/dashboard');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Google Sign-In Failed',
        description: error.message || 'An unknown error occurred.',
      });
    } finally {
      setIsLoading(false);
    }
  }


  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      if (mode === 'signup') {
        const signupValues = values as z.infer<typeof signupSchema>;
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          signupValues.email,
          signupValues.password
        );
        const user = userCredential.user;
        await updateProfile(user, { displayName: signupValues.name });

        const userDocRef = doc(firestore, 'users', user.uid);
        const userData = {
          uid: user.uid,
          id: user.uid,
          name: signupValues.name,
          email: signupValues.email,
          createdAt: Timestamp.now(),
        };

        setDocumentNonBlocking(userDocRef, userData, { merge: true });
        
        toast({ title: "Account created successfully!" });
        router.push('/dashboard');

      } else {
        const loginValues = values as z.infer<typeof loginSchema>;
        await signInWithEmailAndPassword(auth, loginValues.email, loginValues.password);
        toast({ title: "Logged in successfully!" });
        router.push('/dashboard');
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Authentication Failed',
        description: error.message || 'An unknown error occurred.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className={cn('grid gap-6')}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid gap-4">
            {mode === 'signup' && (
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your Name" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="name@example.com" {...field} disabled={isLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} disabled={isLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {mode === 'signup' && (
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <Button disabled={isLoading} className="w-full">
              {isLoading && (
                <Loader className="mr-2 h-4 w-4" />
              )}
              {mode === 'signup' ? 'Create account' : 'Sign In'}
            </Button>
          </div>
        </form>
      </Form>
       <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>
      <Button variant="outline" type="button" disabled={isLoading} onClick={handleGoogleSignIn}>
        {isLoading ? (
          <Loader className="mr-2 h-4 w-4" />
        ) : (
          <GoogleIcon />
        )}
        Google
      </Button>
      <p className="px-8 text-center text-sm text-muted-foreground">
        {mode === 'login' ? (
          <>
            Don&apos;t have an account?{' '}
            <Link
              href="/signup"
              className="underline underline-offset-4 hover:text-primary"
            >
              Sign up
            </Link>
          </>
        ) : (
          <>
            Already have an account?{' '}
            <Link
              href="/login"
              className="underline underline-offset-4 hover:text-primary"
            >
              Log in
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
