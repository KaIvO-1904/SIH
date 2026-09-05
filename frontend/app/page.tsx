'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { getDemoScenario } from '@/lib/api';

export default function LandingPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const startNormalFlow = () => {
    router.push('/profile');
  };

  const loadDemo = async (scenarioId: string) => {
    setIsLoading(true);
    try {
      const data = await getDemoScenario(scenarioId);
      localStorage.setItem('demo_data', JSON.stringify(data));
      router.push('/report');
    } catch (e) {
      alert('Failed to load demo scenario. Is the backend running?');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-zinc-100 selection:text-black">
      {/* Background Grain/Noise Effect for texture */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>

      <main className="relative z-10 min-h-screen flex flex-col items-center justify-center p-6 overflow-hidden">

        {/* Animated Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center mb-16"
        >
          <motion.h1
            className="text-6xl md:text-8xl font-black tracking-tighter text-zinc-100 mb-6 uppercase"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            GramNirnay.ai
          </motion.h1>
          <motion.p
            className="text-lg md:text-2xl font-medium text-zinc-500 max-w-2xl mx-auto leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 1 }}
          >
            Hyper-Local Business Intelligence for Rural Micro-Entrepreneurs.
            <br />
            <span className="text-zinc-100 font-bold italic">Business Viability Before Financing.</span>
          </motion.p>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="flex flex-col sm:flex-row gap-6"
        >
          <button
            onClick={startNormalFlow}
            className="group relative px-8 py-4 bg-zinc-100 text-black rounded-full font-bold text-lg overflow-hidden transition-all active:scale-95"
          >
            <span className="relative z-10">Start Analysis</span>
            <motion.div
              className="absolute inset-0 bg-zinc-200 transition-colors duration-300"
              whileHover={{ backgroundColor: "#444" }}
            />
          </button>

          <button
            onClick={() => loadDemo('dairy_ramanagara')}
            disabled={isLoading}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="px-8 py-4 bg-transparent text-zinc-100 border-2 border-zinc-800 rounded-full font-bold text-lg transition-all active:scale-95 disabled:opacity-50 hover:bg-zinc-100 hover:text-black"
          >
            {isLoading ? 'Analyzing...' : 'Explore Demo'}
          </button>
        </motion.div>

        {/* Feature Grid - Minimalist Monochrome */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-12 max-w-6xl w-full"
        >
          {[
            { icon: "01", title: "Hyper-Local", desc: "Precision market intelligence using geospatial proxies." },
            { icon: "02", title: "Deterministic", desc: "Financial projections based on code, not LLM guesses." },
            { icon: "03", title: "Evidence-Backed", desc: "Government scheme matching with verified citations." }
          ].map((feat, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -10 }}
              className="group p-8 border-t border-zinc-800 transition-all duration-300 hover:bg-zinc-900/50"
            >
              <div className="text-sm font-mono text-zinc-400 mb-4">{feat.icon}</div>
              <h3 className="text-xl font-bold mb-3 uppercase tracking-tight">{feat.title}</h3>
              <p className="text-zinc-500 leading-relaxed">{feat.desc}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Subtle Footer */}
        <footer className="absolute bottom-8 text-xs font-mono text-zinc-400 uppercase tracking-widest">
          GramNirnay.ai © 2026 — Rural Intelligence System
        </footer>
      </main>
    </div>
  );
}
