'use client';

import { createContext, useContext, useState, ReactNode, useMemo, useEffect } from 'react';
import en from '@/locales/en.json';
import es from '@/locales/es.json';

type Locale = 'en' | 'es';

const translations = { en, es };

interface LocaleContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: typeof en; 
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

export const LocaleProvider = ({ children }: { children: ReactNode }) => {
  const [locale, setLocale] = useState<Locale>('en');

  useEffect(() => {
    const storedLocale = localStorage.getItem('locale') as Locale | null;
    if (storedLocale && ['en', 'es'].includes(storedLocale)) {
      setLocale(storedLocale);
    }
  }, []);
  
  const handleSetLocale = (newLocale: Locale) => {
    setLocale(newLocale);
    localStorage.setItem('locale', newLocale);
  };

  const t = useMemo(() => translations[locale], [locale]);

  return (
    <LocaleContext.Provider value={{ locale, setLocale: handleSetLocale, t }}>
      {children}
    </LocaleContext.Provider>
  );
};

export const useLocale = () => {
  const context = useContext(LocaleContext);
  if (context === undefined) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return context;
};
