'use client';
import './globals.css';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/hooks/use-auth';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { LocaleProvider } from '@/hooks/use-locale';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <FirebaseClientProvider>
          <LocaleProvider>
            <AuthProvider>
              {children}
              <Toaster />
            </AuthProvider>
          </LocaleProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
