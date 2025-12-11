import { AuthForm } from '@/components/auth/auth-form';

export default function LoginPage() {
  return (
    <>
      <div className="mb-6 flex flex-col space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
        <p className="text-sm text-muted-foreground">
          Sign in to your account
        </p>
      </div>
      <AuthForm mode="login" />
    </>
  );
}