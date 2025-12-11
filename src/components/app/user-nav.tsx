'use client';

import { signOut } from 'firebase/auth';
import { useAuth, useFirestore } from '@/firebase';
import { useAuth as useAppAuth } from '@/hooks/use-auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu';
import { LogOut, Globe, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLocale } from '@/hooks/use-locale';


export function UserNav() {
  const { userProfile } = useAppAuth();
  const auth = useAuth();
  const router = useRouter();
  const { locale, setLocale, t } = useLocale();

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  if (!userProfile) return null;

  const getInitials = (name: string) => {
    const names = name.split(' ');
    const initials = names.map(n => n[0]).join('');
    return initials.toUpperCase().slice(0, 2);
  };
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-full justify-start gap-2 px-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src="/avatars/01.png" alt={userProfile.name} />
            <AvatarFallback>{getInitials(userProfile.name)}</AvatarFallback>
          </Avatar>
          <div className="text-left">
            <p className="text-sm font-medium leading-none">{userProfile.name}</p>
            <p className="text-xs leading-none text-muted-foreground">{userProfile.email}</p>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{userProfile.name}</p>
            <p className="text-xs leading-none text-muted-foreground">{userProfile.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Globe className="mr-2 h-4 w-4" />
              <span>{t.language}</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <DropdownMenuItem onClick={() => setLocale('en')}>
                  <span className='w-8'>{locale === 'en' && <Check className="h-4 w-4" />}</span>
                  <span>English</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLocale('es')}>
                   <span className='w-8'>{locale === 'es' && <Check className="h-4 w-4" />}</span>
                  <span>Español</span>
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>{t.logOut}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
