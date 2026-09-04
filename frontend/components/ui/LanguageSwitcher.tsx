'use client';
import React from 'react';
import { useLanguage } from '@/lib/LanguageContext';
import { useTheme } from '@/lib/ThemeContext';
import { Button } from '@/components/ui/button';

export default function LanguageSwitcher() {
  const { lang, setLang } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="fixed top-4 right-4 z-50 flex gap-2 p-1 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 rounded-full shadow-sm">
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
      <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-700 mx-1 self-center" />
      <Button
        variant="ghost"
        onClick={toggleTheme}
        className="px-3 py-1 text-xs font-bold uppercase rounded-full h-8"
      >
        {theme === 'light' ? '🌙' : '☀️'}
      </Button>
    </div>
  );
}
