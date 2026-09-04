'use client';
import React from 'react';
import { useLanguage } from '@/lib/LanguageContext';
import { Button } from '@/components/ui/button';

export default function LanguageSwitcher() {
  const { lang, setLang } = useLanguage();

  return (
    <div className="fixed top-4 right-4 z-50 flex gap-2 p-1 bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-full shadow-xl">
      <Button
        variant={lang === 'en' ? 'primary' : 'ghost'}
        onClick={() => setLang('en')}
        className="px-3 py-1 text-xs font-bold uppercase rounded-full h-8"
      >
        EN
      </Button>
      <Button
        variant={lang === 'hi' ? 'primary' : 'ghost'}
        onClick={() => setLang('hi')}
        className="px-3 py-1 text-xs font-bold uppercase rounded-full h-8"
      >
        HI
      </Button>
    </div>
  );
}
