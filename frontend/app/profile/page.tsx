'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { analyzeViability } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const STEPS = [
  { id: 'idea', title: 'The Vision', description: 'Tell us about your business idea' },
  { id: 'money', title: 'The Capital', description: 'Your budget and investment goals' },
  { id: 'context', title: 'The Context', description: 'Your experience and location' },
];

export default function ProfilePage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    businessIdea: '',
    availableCapital: '',
    experience: '',
    targetInvestment: '',
    location: { district: '', state: '' }
  });

  const nextStep = () => setStep(s => Math.min(s + 1, STEPS.length - 1));
  const prevStep = () => setStep(s => Math.max(s - 1, 0));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const profile = {
        ...formData,
        availableCapital: parseFloat(formData.availableCapital),
        experience: parseInt(formData.experience),
        targetInvestment: parseFloat(formData.targetInvestment || '0'),
        location: {
          district: formData.location.district,
          state: formData.location.state,
          lat: 0, lng: 0
        }
      };

      const result = await analyzeViability(profile);
      localStorage.setItem('analysis_result', JSON.stringify(result));
      router.push('/report');
    } catch (e) {
      alert('Analysis failed. Please check if the backend is running.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-black p-6 md:p-12 font-sans">
      <div className="max-w-xl mx-auto mt-12">

        {/* Progress Bar */}
        <div className="flex justify-between mb-12 px-2">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex flex-col items-center gap-2 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                i <= step ? 'bg-black text-white' : 'bg-zinc-200 text-zinc-500'
              }`}>
                {i + 1}
              </div>
              <span className={`text-[10px] uppercase font-bold tracking-tighter ${i === step ? 'text-black' : 'text-zinc-400'}`}>
                {s.title}
              </span>
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card title={STEPS[step].title} subtitle={STEPS[step].description}>
              <form onSubmit={handleSubmit} className="space-y-6">

                {step === 0 && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Describe your business</label>
                    <textarea
                      required
                      className="w-full p-4 bg-zinc-50 border-2 border-zinc-100 rounded-xl focus:border-black outline-none transition-all text-lg"
                      placeholder="e.g., a dairy farm with 10 cows in my village"
                      rows={4}
                      value={formData.businessIdea}
                      onChange={(e) => setFormData({...formData, businessIdea: e.target.value})}
                    />
                  </div>
                )}

                {step === 1 && (
                  <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Available Capital (₹)</label>
                      <input
                        required
                        type="number"
                        className="w-full p-4 bg-zinc-50 border-2 border-zinc-100 rounded-xl focus:border-black outline-none transition-all"
                        value={formData.availableCapital}
                        onChange={(e) => setFormData({...formData, availableCapital: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Target Investment (₹)</label>
                      <input
                        type="number"
                        className="w-full p-4 bg-zinc-50 border-2 border-zinc-100 rounded-xl focus:border-black outline-none transition-all"
                        value={formData.targetInvestment}
                        onChange={(e) => setFormData({...formData, targetInvestment: e.target.value})}
                      />
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Experience (Years)</label>
                      <input
                        required
                        type="number"
                        className="w-full p-4 bg-zinc-50 border-2 border-zinc-100 rounded-xl focus:border-black outline-none transition-all"
                        value={formData.experience}
                        onChange={(e) => setFormData({...formData, experience: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">District & State</label>
                      <input
                        required
                        className="w-full p-4 bg-zinc-50 border-2 border-zinc-100 rounded-xl focus:border-black outline-none transition-all"
                        placeholder="e.g., Ramanagara, Karnataka"
                        value={formData.location.district}
                        onChange={(e) => setFormData({...formData, location: {...formData.location, district: e.target.value}})}
                      />
                    </div>
                  </div>
                )}

                <div className="flex justify-between pt-6">
                  {step > 0 ? (
                    <Button variant="ghost" onClick={prevStep}>Back</Button>
                  ) : <div />}

                  {step < STEPS.length - 1 ? (
                    <Button onClick={nextStep}>Next</Button>
                  ) : (
                    <Button
                      variant="primary"
                      disabled={isLoading}
                      onClick={handleSubmit}
                    >
                      {isLoading ? 'Analyzing...' : 'Get My Report'}
                    </Button>
                  )}
                </div>
              </form>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
