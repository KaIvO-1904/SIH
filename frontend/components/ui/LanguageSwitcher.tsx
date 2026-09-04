'use client';
import React from 'react';
import { useLanguage } from '@/lib/LanguageContext';
import { Button } from '@/components/ui/button';

export default function LanguageSwitcher() {
  const { lang, setLang } = useLanguage();

  return (
    <div className="fixed top-4 right-4 z-50 flex gap-2 p-1 bg-white/80 backdrop-blur-md border border-zinc-200 rounded-full shadow-sm">
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
