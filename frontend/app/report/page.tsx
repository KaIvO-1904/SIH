'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { calculateEMI, calculateBreakEven, calculateROI } from '@/lib/financials';

export default function ReportPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
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
      const parsed = JSON.parse(source);
      setData(parsed);

      // Initialize sandbox with backend results
      const fin = parsed.financials;
      setSandbox({
        setupCost: fin.total_project_cost || 0,
        monthlyRevenue: fin.monthly_revenue || 0,
        monthlyExpenses: fin.monthly_expenses || 0,
        loanAmount: fin.financing_required || 0,
        interestRate: 9,
        tenureYears: 5
      });
    } else {
      router.push('/');
    }
  }, [router]);

  // Real-time calculations for the sandbox
  const emi = calculateEMI(sandbox.loanAmount, sandbox.interestRate, sandbox.tenureYears);
  const breakEven = calculateBreakEven(sandbox.setupCost, sandbox.monthlyRevenue, sandbox.monthlyExpenses + emi);
  const annualProfit = (sandbox.monthlyRevenue - sandbox.monthlyExpenses - emi) * 12;
  const roi = calculateROI(annualProfit, sandbox.setupCost);

  // Generate data for the break-even chart
  const chartData = Array.from({ length: 24 }, (_, i) => {
    const month = i + 1;
    const cumulativeProfit = (sandbox.monthlyRevenue - sandbox.monthlyExpenses - emi) * month;
    return { month, profit: cumulativeProfit };
  });

  if (!data) return <div className="min-h-screen bg-white flex items-center justify-center">Loading Analysis...</div>;

  return (
    <div className="min-h-screen bg-white text-black p-6 md:p-12 font-sans selection:bg-black selection:text-white">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-6xl font-black uppercase tracking-tighter mb-2">Analysis Report</h1>
            <p className="text-zinc-500 font-medium text-lg">Hyper-Local Business Intelligence</p>
          </motion.div>
          <Button variant="outline" onClick={() => router.push('/')}>Start New Analysis</Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

          {/* Column 1: The Verdict (3 cols) */}
          <div className="lg:col-span-4 space-y-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-8 border-4 border-black rounded-3xl text-center bg-white"
            >
              <div className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-4">Viability Score</div>
              <div className="text-9xl font-black mb-6">{data.viabilityScore}</div>
              <div className={`text-xl font-bold uppercase py-3 px-6 rounded-full inline-block transition-all ${
                data.recommendation === 'Proceed' ? 'bg-green-100 text-green-700' :
                data.recommendation === 'Proceed with Modification' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
              }`}>
                {data.recommendation}
              </div>
            </motion.div>

            <Card title="AI Insights" subtitle="Contextual Reasoning">
              <p className="text-zinc-700 leading-relaxed italic text-lg">
                "{data.interpreter_reasoning || "Analysis based on regional benchmarks."}"
              </p>
            </Card>
          </div>

          {/* Column 2 & 3: The Sandbox & Results (8 cols) */}
          <div className="lg:col-span-8 space-y-12">

            {/* The Interactive Sandbox */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-8 bg-black text-white rounded-3xl shadow-2xl"
            >
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-2xl font-black uppercase tracking-tight">Financial Sandbox</h2>
                  <p className="text-zinc-400 text-sm">Tweak parameters to see real-time viability</p>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold uppercase text-zinc-500">Real-time ROI</div>
                  <div className="text-3xl font-black text-white">{roi.toFixed(1)}%</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                <div className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex justify-between text-xs font-bold uppercase text-zinc-400">
                      <span>Total Investment (₹)</span>
                      <span>{sandbox.setupCost}</span>
                    </div>
                    <input
                      type="range" min="10000" max="5000000" step="10000"
                      value={sandbox.setupCost}
                      onChange={(e) => setSandbox({...sandbox, setupCost: parseInt(e.target.value)})}
                      className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white"
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between text-xs font-bold uppercase text-zinc-400">
                      <span>Monthly Revenue (₹)</span>
                      <span>{sandbox.monthlyRevenue}</span>
                    </div>
                    <input
                      type="range" min="5000" max="500000" step="1000"
                      value={sandbox.monthlyRevenue}
                      onChange={(e) => setSandbox({...sandbox, monthlyRevenue: parseInt(e.target.value)})}
                      className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white"
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between text-xs font-bold uppercase text-zinc-400">
                      <span>Loan Amount (₹)</span>
                      <span>{sandbox.loanAmount}</span>
                    </div>
                    <input
                      type="range" min="0" max="5000000" step="10000"
                      value={sandbox.loanAmount}
                      onChange={(e) => setSandbox({...sandbox, loanAmount: parseInt(e.target.value)})}
                      className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white"
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
                      <div className="text-xl font-black">{breakEven === Infinity ? 'Never' : `${Math.round(breakEven)} Mo`}</div>
                    </div>
                  </div>

                  <div className="h-40 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                        <XAxis dataKey="month" hide />
                        <YAxis hide />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#000', border: '1px solid #333', color: '#fff', fontSize: '12px' }}
                          itemStyle={{ color: '#fff' }}
                        />
                        <Line type="monotone" dataKey="profit" stroke="#fff" strokeWidth={3} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Matched Schemes */}
            <div className="space-y-6">
              <h3 className="text-2xl font-black uppercase tracking-tight">Financing Roadmap</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {data.matchedSchemes?.map((scheme: any, i: number) => (
                  <Card key={i} className="group hover:border-black transition-all">
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="font-bold text-lg leading-tight">{scheme.name}</h4>
                      <span className="text-[10px] font-bold uppercase bg-zinc-100 px-2 py-1 rounded">{scheme.ministry}</span>
                    </div>
                    <div className="text-sm text-zinc-500 mb-6 space-y-1">
                      <p>Subsidy: {scheme.benefit.subsidyPercent}%</p>
                      <p>Max Loan: ₹{scheme.benefit.loanAmount}</p>
                    </div>
                    <a
                      href={scheme.sourceUrl}
                      target="_blank"
                      className="text-xs font-bold uppercase tracking-widest border-b-2 border-black pb-1 inline-block group-hover:text-zinc-500 transition-colors"
                    >
                      View Guidelines →
                    </a>
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
