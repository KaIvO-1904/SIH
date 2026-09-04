'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { analyzeViability } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/lib/LanguageContext';
import { t } from '@/lib/i18n';
import { UserProfile } from '@/types';

const STEPS = [
  {
    id: 'businessIdea',
    title: t('en', 'onboarding.step1_title'),
    description: t('en', 'onboarding.step1_desc'),
    question: "What business are you planning to launch?",
    placeholder: "e.g., a dairy farm with 10 cows",
    type: 'text',
    key: 'businessIdea'
  },
  {
    id: 'availableCapital',
    title: t('en', 'onboarding.step2_title'),
    description: t('en', 'onboarding.step2_desc'),
    question: "How much capital do you currently have available to invest?",
    placeholder: "e.g., 50000",
    type: 'number',
    key: 'availableCapital'
  },
  {
    id: 'targetInvestment',
    title: t('en', 'onboarding.step3_title'),
    description: t('en', 'onboarding.step3_desc'),
    question: "What is your total target investment for this project?",
    placeholder: "e.g., 200000",
    type: 'number',
    key: 'targetInvestment'
  },
  {
    id: 'experience',
    title: t('en', 'onboarding.step4_title'),
    description: t('en', 'onboarding.step4_desc'),
    question: "How many years of experience do you have in this field?",
    placeholder: "e.g., 3",
    type: 'number',
    key: 'experience'
  },
  {
    id: 'locationDistrict',
    title: t('en', 'onboarding.step5_title'),
    description: t('en', 'onboarding.step5_desc'),
    question: "Which district are you located in?",
    placeholder: "e.g., Ramanagara",
    type: 'text',
    key: 'district'
  },
  {
    id: 'locationState',
    title: t('en', 'onboarding.step6_title'),
    description: t('en', 'onboarding.step6_desc'),
    question: "And which state is that in?",
    placeholder: "e.g., Karnataka",
    type: 'text',
    key: 'state'
  },
];

export default function ProfilePage() {
  const { lang } = useLanguage();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Partial<UserProfile>>({
    location: { district: '', state: '' },
    businessIdea: '',
    availableCapital: 0,
    experience: 0,
    targetInvestment: 0,
  });
  const [inputValue, setInputValue] = useState('');

  const handleNext = async () => {
    if (!inputValue.trim() && STEPS[currentStep].id !== 'targetInvestment') return;

    const step = STEPS[currentStep];
    const updatedData = { ...formData };

    if (step.key === 'district') {
      updatedData.location = { ...updatedData.location!, district: inputValue };
    } else if (step.key === 'state') {
      updatedData.location = { ...updatedData.location!, state: inputValue };
    } else {
      (updatedData as any)[step.key] = step.type === 'number' ? parseFloat(inputValue) || 0 : inputValue;
    }

    setFormData(updatedData);
    setInputValue('');

    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      await submitAnalysis(updatedData);
    }
  };

  const submitAnalysis = async (finalData: any) => {
    setIsLoading(true);
    try {
      const profile: UserProfile = {
        ...finalData,
        location: { ...finalData.location, lat: 0, lng: 0 },
      };

      const result = await analyzeViability(profile);
      localStorage.setItem('analysis_result', JSON.stringify(result));
      router.push('/report');
    } catch (e: any) {
      alert(e.message || 'Analysis failed. Please check if the backend is running.');
    } finally {
      setIsLoading(false);
    }
  };

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-black dark:text-zinc-100 p-6 md:p-12 font-sans flex flex-col items-center justify-center">
      <div className="w-full max-w-xl">
        <div className="mb-8 space-y-2">
          <h1 className="text-3xl font-black uppercase tracking-tighter text-center">
            {t(lang, 'onboarding.title')}
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-center">
            {t(lang, 'onboarding.subtitle')}
          </p>
        </div>

        <Progress value={progress} className="mb-8 h-2 bg-zinc-200" />

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="border-2 border-black dark:border-zinc-100 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.2)]">
              <CardHeader>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                    Step {currentStep + 1} of {STEPS.length}
                  </span>
                </div>
                <CardTitle className="text-2xl font-black uppercase tracking-tight">
                  {STEPS[currentStep].title}
                </CardTitle>
                <CardDescription className="text-zinc-500 dark:text-zinc-400">
                  {STEPS[currentStep].description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold uppercase tracking-tight">
                    {STEPS[currentStep].question}
                  </label>
                  <Input
                    type={STEPS[currentStep].type === 'number' ? 'number' : 'text'}
                    placeholder={STEPS[currentStep].placeholder}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="text-lg py-6 border-2 focus:border-black"
                    disabled={isLoading}
                    onKeyDown={(e) => e.key === 'Enter' && handleNext()}
                  />
                </div>
                <div className="flex justify-end gap-4">
                  {currentStep > 0 && (
                    <Button
                      variant="ghost"
                      onClick={() => { setCurrentStep(currentStep - 1); setInputValue(''); }}
                      disabled={isLoading}
                    >
                      Back
                    </Button>
                  )}
                  <Button
                    className="px-8 font-bold uppercase tracking-tight bg-black text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-black dark:hover:bg-zinc-200"
                    onClick={handleNext}
                    disabled={isLoading || (!inputValue.trim() && STEPS[currentStep].id !== 'targetInvestment')}
                  >
                    {currentStep === STEPS.length - 1 ? (isLoading ? 'Analyzing...' : 'Analyze Now') : 'Next'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
