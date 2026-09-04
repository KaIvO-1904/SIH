'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { calculateEMI, calculateBreakEven, calculateROI } from '@/lib/financials';
import { useLanguage } from '@/lib/LanguageContext';
import { t } from '@/lib/i18n';
import { AnalysisResult } from '@/types';

export default function ReportPage() {
  const { lang } = useLanguage();
  const router = useRouter();
  const [data, setData] = useState<AnalysisResult | null>(null);
  const [sandbox, setSandbox] = useState({
    setupCost: 0,
    monthlyRevenue: 0,
    monthlyExpenses: 0,
    loanAmount: 0,
    interestRate: 9,
    tenureYears: 5
  });

  useEffect(() => {
    const stored = localStorage.getItem('analysis_result');
    const demo = localStorage.getItem('demo_data');
    const source = stored || demo;

    if (source) {
      try {
        const parsed: AnalysisResult = JSON.parse(source);
        setData(parsed);

        const fin = parsed.financials;
        setSandbox({
          setupCost: fin.total_project_cost || 0,
          monthlyRevenue: fin.monthly_revenue || 0,
          monthlyExpenses: fin.monthly_expenses || 0,
          loanAmount: fin.financing_required || 0,
          interestRate: 9,
          tenureYears: 5
        });
      } catch (e) {
        console.error("Failed to parse analysis data", e);
        router.push('/');
      }
    } else {
      router.push('/');
    }
  }, [router]);

  const emi = calculateEMI(sandbox.loanAmount, sandbox.interestRate, sandbox.tenureYears);
  const breakEven = calculateBreakEven(sandbox.setupCost, sandbox.monthlyRevenue, sandbox.monthlyExpenses + emi);
  const annualProfit = (sandbox.monthlyRevenue - sandbox.monthlyExpenses - emi) * 12;
  const roi = calculateROI(annualProfit, sandbox.setupCost);

  const chartData = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const monthlyProfit = sandbox.monthlyRevenue - sandbox.monthlyExpenses - emi;
    const cumulativeCash = monthlyProfit * month;
    return {
      month: `Mo ${month}`,
      profit: Math.round(monthlyProfit),
      cash: Math.round(cumulativeCash)
    };
  });

  if (!data) return <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center font-sans">Loading Analysis...</div>;

  const getRecommendationColor = (rec: string) => {
    if (rec === 'Proceed') return 'bg-green-900/30 text-green-400 border-green-800';
    if (rec === 'Proceed with Modification') return 'bg-yellow-900/30 text-yellow-400 border-yellow-800';
    return 'bg-red-900/30 text-red-400 border-red-800';
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6 md:p-12 font-sans selection:bg-zinc-100 selection:text-black">
      <div className="max-w-6xl mx-auto">

        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-6xl font-black uppercase tracking-tighter mb-2">{t(lang, 'report.title')}</h1>
            <p className="text-zinc-500 font-medium text-lg">{t(lang, 'report.subtitle')}</p>
          </motion.div>
          <Button variant="outline" onClick={() => router.push('/')} className="font-bold uppercase tracking-tight">
            {t(lang, 'report.new_analysis')}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

          <div className="lg:col-span-4 space-y-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-8 border-2 border-zinc-800 rounded-3xl text-center bg-zinc-900/50 backdrop-blur-sm shadow-[0_20px_50px_rgba(0,0,0,0.5)] hover:border-zinc-700 transition-colors"
            >
              <div className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-4">
                {t(lang, 'report.viability_score')}
              </div>
              <div className="text-9xl font-black mb-6">{data.viabilityScore}</div>
              <Badge variant="outline" className={`text-xl px-6 py-2 rounded-full font-bold uppercase border-2 ${getRecommendationColor(data.recommendation)}`}>
                {data.recommendation}
              </Badge>
            </motion.div>

            <Card className="border-2 border-zinc-800 bg-zinc-900/50 backdrop-blur-sm shadow-[0_10px_30px_rgba(0,0,0,0.4)] hover:border-zinc-700 transition-colors relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-100">
                  <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
                </svg>
              </div>
              <CardHeader>
                <CardTitle className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                  <span className="w-2 h-2 bg-zinc-100 rounded-full animate-pulse" />
                  {t(lang, 'report.ai_insights')}
                </CardTitle>
                <CardDescription className="font-medium text-zinc-400">
                  {t(lang, 'report.context_reasoning')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <span className="absolute -top-2 -left-2 text-4xl text-zinc-700 font-serif leading-none">“</span>
                  <p className="text-zinc-300 leading-relaxed italic text-lg relative z-10 pl-4">
                    {data.interpreter_reasoning || "Analysis based on regional benchmarks."}
                  </p>
                  <span className="absolute -bottom-6 right-0 text-4xl text-zinc-700 font-serif leading-none">”</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-8 space-y-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-8 bg-black text-white rounded-3xl shadow-2xl"
            >
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-2xl font-black uppercase tracking-tight">{t(lang, 'report.sandbox_title')}</h2>
                  <p className="text-zinc-400 text-sm">{t(lang, 'report.sandbox_subtitle')}</p>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold uppercase text-zinc-500">Real-time ROI</div>
                  <div className="text-3xl font-black text-white">{roi.toFixed(1)}%</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                <div className="space-y-8">
                  <div className="space-y-4">
                    <div className="flex justify-between text-xs font-bold uppercase text-zinc-400">
                      <span>Total Investment (₹)</span>
                      <span className="text-white">{sandbox.setupCost.toLocaleString()}</span>
                    </div>
                    <Slider
                      value={[sandbox.setupCost]}
                      min={10000} max={5000000} step={10000}
                      onValueChange={(val) => setSandbox({...sandbox, setupCost: val[0]})}
                      className="py-4"
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between text-xs font-bold uppercase text-zinc-400">
                      <span>Monthly Revenue (₹)</span>
                      <span className="text-white">{sandbox.monthlyRevenue.toLocaleString()}</span>
                    </div>
                    <Slider
                      value={[sandbox.monthlyRevenue]}
                      min={5000} max={500000} step={1000}
                      onValueChange={(val) => setSandbox({...sandbox, monthlyRevenue: val[0]})}
                      className="py-4"
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between text-xs font-bold uppercase text-zinc-400">
                      <span>Loan Amount (₹)</span>
                      <span className="text-white">{sandbox.loanAmount.toLocaleString()}</span>
                    </div>
                    <Slider
                      value={[sandbox.loanAmount]}
                      min={0} max={5000000} step={10000}
                      onValueChange={(val) => setSandbox({...sandbox, loanAmount: val[0]})}
                      className="py-4"
                    />
                  </div>
                </div>

                <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="text-[10px] font-bold uppercase text-zinc-500">Monthly EMI</div>
                      <div className="text-xl font-black">₹{Math.round(emi).toLocaleString()}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-[10px] font-bold uppercase text-zinc-500">Break-even</div>
                      <div className="text-xl font-black">{breakEven === 999 ? 'Never' : `${Math.round(breakEven)} Mo`}</div>
                    </div>
                  </div>

                  <div className="h-40 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                        <XAxis dataKey="month" stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis stroke="#666" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value/1000}k`} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#000', border: '1px solid #333', color: '#fff', fontSize: '12px' }}
                          itemStyle={{ color: '#fff' }}
                        />
                        <Line type="monotone" dataKey="cash" name="Cumulative Cash" stroke="#fff" strokeWidth={3} dot={false} />
                        <Line type="monotone" dataKey="profit" name="Monthly Profit" stroke="#888" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </motion.div>

            <div className="space-y-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-zinc-100 rounded-lg">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                  </svg>
                </div>
                <h3 className="text-2xl font-black uppercase tracking-tight">{t(lang, 'report.roadmap_title')}</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {data.matchedSchemes?.map((scheme: any, i: number) => (
                  <Card key={i} className="group hover:border-zinc-600 transition-all border-2 border-zinc-800 bg-zinc-900/40 backdrop-blur-sm shadow-[0_10px_20px_rgba(0,0,0,0.3)] overflow-hidden">
                    <div className="h-1 w-full bg-zinc-800 group-hover:bg-zinc-100 transition-colors" />
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start gap-2">
                        <CardTitle className="font-bold text-lg leading-tight">{scheme.name}</CardTitle>
                        <Badge variant="secondary" className="text-[10px] font-bold uppercase bg-zinc-800 text-zinc-400 border-zinc-700">
                          {scheme.ministry}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-2 gap-4 p-4 bg-zinc-950/50 rounded-xl border border-zinc-800">
                        <div className="space-y-1">
                          <div className="text-[10px] font-bold uppercase text-zinc-500">Subsidy</div>
                          <div className="text-zinc-100 font-black text-lg">{scheme.benefit.subsidyPercent}%</div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-[10px] font-bold uppercase text-zinc-500">Max Loan</div>
                          <div className="text-zinc-100 font-black text-lg">₹{scheme.benefit.loanAmount}</div>
                        </div>
                      </div>
                      <Button variant="ghost" asChild className="w-full justify-center p-0 h-auto text-xs font-bold uppercase tracking-widest border-b-2 border-zinc-800 pb-2 inline-block group-hover:text-zinc-100 group-hover:border-zinc-100 transition-colors">
                        <a href={scheme.sourceUrl} target="_blank" rel="noopener noreferrer">
                          View Guidelines →
                        </a>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
