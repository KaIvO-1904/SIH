'use client';
import React, { useEffect, useState, useMemo } from 'react';
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

type ScenarioPreset = 'conservative' | 'base' | 'optimistic';

export default function ReportPage() {
  const { lang } = useLanguage();
  const router = useRouter();
  const [data, setData] = useState<AnalysisResult | null>(null);
  const [activePreset, setActivePreset] = useState<ScenarioPreset>('base');
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

  // Apply Scenario Multipliers
  const effectiveSandbox = useMemo(() => {
    let revMult = 1, expMult = 1;
    if (activePreset === 'conservative') { revMult = 0.85; expMult = 1.1; }
    if (activePreset === 'optimistic') { revMult = 1.15; expMult = 0.9; }

    return {
      ...sandbox,
      monthlyRevenue: sandbox.monthlyRevenue * revMult,
      monthlyExpenses: sandbox.monthlyExpenses * expMult,
    };
  }, [sandbox, activePreset]);

  const emi = calculateEMI(effectiveSandbox.loanAmount, effectiveSandbox.interestRate, effectiveSandbox.tenureYears);
  const breakEven = calculateBreakEven(effectiveSandbox.setupCost, effectiveSandbox.monthlyRevenue, effectiveSandbox.monthlyExpenses + emi);
  const annualProfit = (effectiveSandbox.monthlyRevenue - effectiveSandbox.monthlyExpenses - emi) * 12;
  const roi = calculateROI(annualProfit, effectiveSandbox.setupCost);

  const chartData = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const monthlyProfit = effectiveSandbox.monthlyRevenue - effectiveSandbox.monthlyExpenses - emi;
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

  const deriveRisks = () => {
    const risks = [];
    if (breakEven > 36) risks.push({ label: "Long Payback Period", impact: "High", note: "Break-even exceeds 3 years, increasing capital risk." });
    if (effectiveSandbox.monthlyRevenue > 0 && (effectiveSandbox.monthlyRevenue - effectiveSandbox.monthlyExpenses - emi) / effectiveSandbox.monthlyRevenue < 0.15) {
        risks.push({ label: "Low Profit Margin", impact: "Medium", note: "Thin margins make the business sensitive to cost increases." });
    }
    if (effectiveSandbox.setupCost > 0 && effectiveSandbox.loanAmount / effectiveSandbox.setupCost > 0.7) {
        risks.push({ label: "High Debt Reliance", impact: "Medium", note: "Heavy reliance on external funding increases monthly EMI pressure." });
    }
    if (data.marketAnalysis.competition > 70) {
        risks.push({ label: "Market Saturation", impact: "High", note: "High local competition may compress pricing and revenue." });
    }
    return risks;
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6 md:p-12 font-sans selection:bg-zinc-100 selection:text-black">
      <div className="max-w-6xl mx-auto">

        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6 border-b border-zinc-800 pb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">Business Intelligence Report</div>
            <h1 className="text-5xl font-black uppercase tracking-tighter mb-2">{t(lang, 'report.title')}</h1>
            <p className="text-zinc-500 font-medium text-lg">{t(lang, 'report.subtitle')}</p>
          </motion.div>
          <Button variant="outline" onClick={() => router.push('/')} className="font-bold uppercase tracking-tight border-zinc-800 hover:bg-zinc-100 hover:text-black transition-all">
            {t(lang, 'report.new_analysis')}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* LEFT COLUMN: EXECUTIVE DECISION & METRICS */}
          <div className="lg:col-span-4 space-y-6">

            {/* VIABILITY SCORE CARD */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-8 border border-zinc-800 rounded-2xl text-center bg-zinc-900/40 backdrop-blur-sm shadow-sm"
            >
              <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-4">
                Overall Viability Score
              </div>
              <div className="text-7xl font-black mb-4 tracking-tighter">{data.viabilityScore}<span className="text-zinc-600 text-3xl ml-1">/100</span></div>
              <Badge variant="outline" className={`text-sm px-4 py-1 rounded-full font-bold uppercase border ${getRecommendationColor(data.recommendation)}`}>
                {data.recommendation}
              </Badge>
              <p className="mt-6 text-sm text-zinc-400 leading-relaxed italic">
                {data.recommendation === 'Proceed' ? "Strong indicators suggest this venture is viable." :
                 data.recommendation === 'Proceed with Modification' ? "Viable, provided certain strategic adjustments are made." :
                 "Current analysis indicates high risk; reconsider business model."}
              </p>
            </motion.div>

            {/* QUICK METRICS GRID */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Annual ROI", value: `${roi.toFixed(1)}%`, color: "text-zinc-100" },
                { label: "Break-even", value: breakEven === 999 ? "Never" : `${Math.round(breakEven)} Mo`, color: "text-zinc-100" },
                { label: "Monthly Net", value: `₹${Math.round(effectiveSandbox.monthlyRevenue - effectiveSandbox.monthlyExpenses - emi).toLocaleString()}`, color: "text-zinc-100" },
                { label: "Debt Burden", value: `${Math.round((emi / effectiveSandbox.monthlyRevenue) * 100 || 0)}%`, color: "text-zinc-100" },
              ].map((m, i) => (
                <div key={i} className="p-4 border border-zinc-800 rounded-xl bg-zinc-900/20">
                  <div className="text-[10px] font-bold uppercase text-zinc-500 mb-1">{m.label}</div>
                  <div className={`text-xl font-black ${m.color}`}>{m.value}</div>
                </div>
              ))}
            </div>

            {/* ANALYST NOTE */}
            <Card className="border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm shadow-sm overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                  <div className="w-1 h-1 bg-zinc-400 rounded-full" />
                  Analyst Note
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-zinc-300 leading-relaxed text-sm italic">
                  {data.interpreter_reasoning || "Analysis based on regional benchmarks and projected market demand."}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT COLUMN: FINANCIALS & ROADMAP */}
          <div className="lg:col-span-8 space-y-8">

            {/* FINANCIAL SANDBOX */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-8 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-sm"
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                  <h2 className="text-xl font-black uppercase tracking-tight">{t(lang, 'report.sandbox_title')}</h2>
                  <p className="text-zinc-500 text-xs font-medium">Adjust assumptions to simulate different business outcomes.</p>
                </div>
                <div className="flex bg-zinc-950 p-1 rounded-lg border border-zinc-800">
                  {(['conservative', 'base', 'optimistic'] as ScenarioPreset[]).map((p) => (
                    <button
                      key={p}
                      onClick={() => setActivePreset(p)}
                      className={`px-3 py-1 text-[10px] font-bold uppercase rounded-md transition-all ${activePreset === p ? 'bg-zinc-100 text-black' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-8">
                  {[
                    { label: "Total Project Cost", key: "setupCost", min: 10000, max: 5000000, step: 10000 },
                    { label: "Estimated Monthly Revenue", key: "monthlyRevenue", min: 5000, max: 500000, step: 1000 },
                    { label: "Fixed Monthly Expenses", key: "monthlyExpenses", min: 1000, max: 200000, step: 1000 },
                    { label: "Funding Required (Loan)", key: "loanAmount", min: 0, max: 5000000, step: 10000 },
                  ].map((ctrl) => (
                    <div key={ctrl.key} className="space-y-4">
                      <div className="flex justify-between text-[11px] font-bold uppercase text-zinc-400">
                        <span>{ctrl.label}</span>
                        <span className="text-zinc-100 font-mono">₹{Math.round((ctrl.key === 'monthlyRevenue' || ctrl.key === 'monthlyExpenses' ? effectiveSandbox[ctrl.key as keyof typeof effectiveSandbox] : sandbox[ctrl.key as keyof typeof sandbox])).toLocaleString()}</span>
                      </div>
                      <Slider
                        value={[sandbox[ctrl.key as keyof typeof sandbox] as number]}
                        min={ctrl.min} max={ctrl.max} step={ctrl.step}
                        onValueChange={(val) => setSandbox({...sandbox, [ctrl.key]: val[0]})}
                        className="py-2"
                      />
                    </div>
                  ))}
                </div>

                <div className="bg-zinc-950 p-6 rounded-xl border border-zinc-800 space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <div className="text-[10px] font-bold uppercase text-zinc-500">Monthly EMI</div>
                      <div className="text-2xl font-black">₹{Math.round(emi).toLocaleString()}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-[10px] font-bold uppercase text-zinc-500">Break-even</div>
                      <div className="text-2xl font-black">{breakEven === 999 ? 'Never' : `${Math.round(breakEven)} Mo`}</div>
                    </div>
                  </div>

                  <div className="h-44 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                        <XAxis dataKey="month" stroke="#555" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis stroke="#555" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v/1000}k`} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#000', border: '1px solid #333', color: '#fff', fontSize: '11px' }}
                          itemStyle={{ color: '#fff' }}
                        />
                        <Line type="monotone" dataKey="cash" name="Cumulative Cash" stroke="#fff" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="profit" name="Monthly Profit" stroke="#666" strokeWidth={1} strokeDasharray="4 4" dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* RISK ASSESSMENT */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border border-zinc-800 bg-zinc-900/40 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-xs font-bold uppercase tracking-widest text-zinc-400">Risk Assessment</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {deriveRisks().length > 0 ? deriveRisks().map((risk, i) => (
                            <div key={i} className="flex gap-4 p-3 rounded-lg bg-zinc-950 border border-zinc-800">
                                <div className={`w-1 h-auto rounded-full ${risk.impact === 'High' ? 'bg-red-500' : 'bg-yellow-500'}`} />
                                <div>
                                    <div className="text-xs font-bold text-zinc-100">{risk.label}</div>
                                    <div className="text-[11px] text-zinc-500">{risk.note}</div>
                                </div>
                            </div>
                        )) : (
                            <div className="text-sm text-zinc-500 italic">No significant financial risks detected under current assumptions.</div>
                        )}
                    </CardContent>
                </Card>

                <Card className="border border-zinc-800 bg-zinc-900/40 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-xs font-bold uppercase tracking-widest text-zinc-400">Recommended Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {data.modifications.length > 0 ? data.modifications.map((mod, i) => (
                            <div key={i} className="flex items-start gap-3 text-xs text-zinc-300">
                                <span className="font-mono text-zinc-600 mt-0.5">0{i+1}</span>
                                <span>{mod}</span>
                            </div>
                        )) : (
                            <div className="text-sm text-zinc-500 italic">No specific modifications suggested.</div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* FINANCING ROADMAP */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-zinc-100 rounded-lg">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                  </svg>
                </div>
                <h3 className="text-lg font-black uppercase tracking-tight">{t(lang, 'report.roadmap_title')}</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="p-4 border border-zinc-800 rounded-xl bg-zinc-900/40">
                    <div className="text-[10px] font-bold uppercase text-zinc-500 mb-1">Total Capital Required</div>
                    <div className="text-xl font-black">₹{data.financials.total_project_cost.toLocaleString()}</div>
                </div>
                <div className="p-4 border border-zinc-800 rounded-xl bg-zinc-900/40">
                    <div className="text-[10px] font-bold uppercase text-zinc-500 mb-1">Self-Funding</div>
                    <div className="text-xl font-black text-zinc-300">₹{(data.financials.total_project_cost - data.financials.financing_required).toLocaleString()}</div>
                </div>
                <div className="p-4 border border-zinc-800 rounded-xl bg-zinc-900/40">
                    <div className="text-[10px] font-bold uppercase text-zinc-500 mb-1">External Funding Gap</div>
                    <div className="text-xl font-black text-zinc-100">₹{data.financials.financing_required.toLocaleString()}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {data.matchedSchemes?.map((scheme: any, i: number) => (
                  <Card key={i} className="group hover:border-zinc-600 transition-all border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start gap-2">
                        <CardTitle className="font-bold text-sm leading-tight">{scheme.name}</CardTitle>
                        <Badge variant="secondary" className="text-[9px] font-bold uppercase bg-zinc-800 text-zinc-400 border-zinc-700">
                          {scheme.ministry}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 p-3 bg-zinc-950 rounded-lg border border-zinc-800">
                        <div className="space-y-1">
                          <div className="text-[10px] font-bold uppercase text-zinc-500">Subsidy</div>
                          <div className="text-zinc-100 font-black text-sm">{scheme.benefit.subsidyPercent}%</div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-[10px] font-bold uppercase text-zinc-500">Max Loan</div>
                          <div className="text-zinc-100 font-black text-sm">₹{scheme.benefit.loanAmount.toLocaleString()}</div>
                        </div>
                      </div>
                      <Button variant="ghost" asChild className="w-full justify-center p-0 h-auto text-[10px] font-bold uppercase tracking-widest border-b border-zinc-800 pb-2 inline-block group-hover:text-zinc-100 group-hover:border-zinc-100 transition-colors">
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

        {/* DATA TRUST FOOTER */}
        <footer className="mt-16 pt-8 border-t border-zinc-800 flex flex-col md:flex-row justify-between items-center gap-4 opacity-60">
          <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
            Analysis generated via GramNirnay.ai Decision Support System
          </div>
          <div className="flex gap-6 text-[10px] font-bold uppercase text-zinc-500">
            <span>Source: {data.marketAnalysis.source}</span>
            <span>Confidence: {data.marketAnalysis.confidence}</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
