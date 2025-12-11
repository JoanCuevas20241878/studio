import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Logo } from '@/components/logo';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authBg = PlaceHolderImages.find(img => img.id === 'auth-background');

  return (
    <div className="flex min-h-screen w-full flex-col lg:grid lg:grid-cols-2">
      <div className="flex flex-col items-center justify-center p-6 sm:p-10">
        <div className="absolute left-6 top-6 lg:left-10 lg:top-10">
          <Logo />
        </div>
        <div className="w-full max-w-md">{children}</div>
      </div>
      <div className="relative hidden bg-muted lg:block">
        {authBg && (
          <Image
            src={authBg.imageUrl}
            alt={authBg.description}
            fill
            className="object-cover"
            data-ai-hint={authBg.imageHint}
            priority
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-background/10" />
      </div>
    </div>
  );
}
