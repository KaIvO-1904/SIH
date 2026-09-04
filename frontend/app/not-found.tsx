'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans flex items-center justify-center p-6">
      <div className="text-center max-w-xl">
        <motion.h1
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-9xl font-black uppercase tracking-tighter mb-4"
        >
          404
        </motion.h1>
        <h2 className="text-2xl font-bold uppercase mb-6">Page Not Found</h2>
        <p className="text-zinc-500 mb-12 text-lg leading-relaxed">
          The page you are looking for doesn't exist or has been moved to a new location.
        </p>
        <Link href="/">
          <Button variant="primary" className="px-8 py-4 font-bold uppercase tracking-tight">
            Return Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
