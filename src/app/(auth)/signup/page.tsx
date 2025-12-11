'use client';

import { AuthForm } from '@/components/auth/auth-form';
import { LocaleSwitcher } from '@/components/locale-switcher';
import { useLocale } from '@/hooks/use-locale';

export default function SignupPage() {
  const { t } = useLocale();

  return (
    <>
       <div className="absolute right-6 top-6 lg:right-10 lg:top-10">
        <LocaleSwitcher />
      </div>
      <div className="mb-6 flex flex-col space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">{t.createAnAccount}</h1>
        <p className="text-sm text-muted-foreground">
          {t.enterYourInfo}
        </p>
      </div>
      <AuthForm mode="signup" />
    </>
  );
}
