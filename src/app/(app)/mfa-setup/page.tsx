'use client';

import { useState } from 'react';
import { MfaSetupForm } from '@/components/auth/mfa-setup-form';
import { MfaVerifyForm } from '@/components/auth/mfa-verify-form';
import { type ConfirmationResult } from 'firebase/auth';
import { Logo } from '@/components/logo';

export default function MfaSetupPage() {
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center p-4">
      <div className="absolute left-6 top-6 lg:left-10 lg:top-10">
        <Logo />
      </div>
      <div className="w-full max-w-md">
        {!confirmationResult ? (
          <MfaSetupForm 
            onVerificationSent={(result, phone) => {
              setConfirmationResult(result);
              setPhoneNumber(phone);
            }} 
          />
        ) : (
          <MfaVerifyForm 
            confirmationResult={confirmationResult} 
            phoneNumber={phoneNumber}
          />
        )}
      </div>
    </div>
  );
}
