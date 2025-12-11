'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useUser } from '@/firebase';
import { AppSidebar } from '@/components/app/sidebar';
import { Loader } from '@/components/ui/loader';
import { multiFactor } from 'firebase/auth';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading) {
      if (!user) {
        router.replace('/login');
      } else {
        // Check for MFA
        const mfaEnrolled = multiFactor(user).enrolledFactors.length > 0;
        if (!mfaEnrolled) {
          // Check if user is trying to access mfa-setup page
          if (window.location.pathname !== '/mfa-setup') {
             // router.push('/mfa-setup');
          }
        }
      }
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader className="h-12 w-12" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar />
      <main className="flex-1 flex flex-col">
        {children}
      </main>
    </div>
  );
}
