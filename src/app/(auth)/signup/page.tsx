import { AuthForm } from '@/components/auth/auth-form';

export default function SignupPage() {
  return (
    <>
      <div className="mb-6 flex flex-col space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Create an account</h1>
        <p className="text-sm text-muted-foreground">
          Enter your information to create an account
        </p>
      </div>
      <AuthForm mode="signup" />
    </>
  );
}
