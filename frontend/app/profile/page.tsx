'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { analyzeViability } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/lib/LanguageContext';
import { useApp } from '@/lib/AppContext';
import { t } from '@/lib/i18n';
import { UserProfile } from '@/types';
import { FadeIn } from '@/components/motion';
import ThreeDIcon from '@/components/3d/ThreeDIcons';
import Card3DTilt from '@/components/3d/Card3DTilt';
import { ArrowRight, ArrowLeft, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';

const STEPS = [
  {
    id: 'businessIdea',
    title: t('en', 'onboarding.step1_title'),
    description: t('en', 'onboarding.step1_desc'),
    question: 'What business are you planning to launch?',
    placeholder: 'e.g., a dairy farm with 10 cows',
    type: 'text',
    key: 'businessIdea',
    iconName: 'idea' as const,
    variant: 'blue' as const,
  },
  {
    id: 'availableCapital',
    title: t('en', 'onboarding.step2_title'),
    description: t('en', 'onboarding.step2_desc'),
    question: 'How much capital do you currently have available to invest?',
    placeholder: 'e.g., 50000',
    type: 'number',
    key: 'availableCapital',
    iconName: 'capital' as const,
    variant: 'emerald' as const,
  },
  {
    id: 'targetInvestment',
    title: t('en', 'onboarding.step3_title'),
    description: t('en', 'onboarding.step3_desc'),
    question: 'What is your total target investment for this project?',
    placeholder: 'e.g., 200000',
    type: 'number',
    key: 'targetInvestment',
    iconName: 'target' as const,
    variant: 'amber' as const,
  },
  {
    id: 'experience',
    title: t('en', 'onboarding.step4_title'),
    description: t('en', 'onboarding.step4_desc'),
    question: 'How many years of experience do you have in this field?',
    placeholder: 'e.g., 3',
    type: 'number',
    key: 'experience',
    iconName: 'experience' as const,
    variant: 'indigo' as const,
  },
  {
    id: 'locationDistrict',
    title: t('en', 'onboarding.step5_title'),
    description: t('en', 'onboarding.step5_desc'),
    question: 'Which district are you located in?',
    placeholder: 'e.g., Ramanagara',
    type: 'text',
    key: 'district',
    iconName: 'district' as const,
    variant: 'cyan' as const,
  },
  {
    id: 'locationState',
    title: t('en', 'onboarding.step6_title'),
    description: t('en', 'onboarding.step6_desc'),
    question: 'And which state is that in?',
    placeholder: 'e.g., Karnataka',
    type: 'text',
    key: 'state',
    iconName: 'state' as const,
    variant: 'purple' as const,
  },
];

export default function ProfilePage() {
  const { lang } = useLanguage();
  const { addHistoryItem } = useApp();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
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
      setDirection(1);
      setCurrentStep(currentStep + 1);
    } else {
      await submitAnalysis(updatedData);
    }
  };

  const handleBack = () => {
    setDirection(-1);
    setCurrentStep(currentStep - 1);
    setInputValue('');
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
      addHistoryItem({
        businessIdea: profile.businessIdea || 'New Venture',
        district: profile.location.district || 'Rural District',
        state: profile.location.state || 'India',
        score: result.viabilityScore || 80,
        recommendation: result.recommendation || 'Proceed with Modification',
        projectCost: result.financials?.total_project_cost || profile.targetInvestment || 500000,
        data: result,
      });
      router.push('/report');
    } catch (e: any) {
      alert(e.message || 'Analysis failed. Please check if the backend is running.');
    } finally {
      setIsLoading(false);
    }
  };

  const progress = ((currentStep + 1) / STEPS.length) * 100;
  const isLastStep = currentStep === STEPS.length - 1;
  const currentStepData = STEPS[currentStep];

  const slideVariants = {
    enter: (dir: number) => ({ opacity: 0, x: dir * 36, scale: 0.96 }),
    center: { opacity: 1, x: 0, scale: 1 },
    exit: (dir: number) => ({ opacity: 0, x: dir * -36, scale: 0.96 }),
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 py-24 relative overflow-hidden"
      style={{ backgroundColor: 'var(--surface-1)', color: 'var(--text-primary)' }}
    >
      {/* 3D Ambient backdrop lighting */}
      <div className="pointer-events-none fixed inset-0 opacity-40">
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] rounded-full blur-3xl"
          style={{
            background: 'radial-gradient(circle, color-mix(in srgb, var(--accent) 15%, transparent) 0%, transparent 70%)',
          }}
        />
        <div
          className="absolute bottom-10 right-10 w-[450px] h-[450px] rounded-full blur-3xl"
          style={{
            background: 'radial-gradient(circle, color-mix(in srgb, #6366f1 12%, transparent) 0%, transparent 70%)',
          }}
        />
      </div>

      {/* Background dot grid pattern */}
      <div
        className="pointer-events-none fixed inset-0 opacity-25"
        style={{
          backgroundImage: 'url(/media/grid-pattern.svg)',
          backgroundSize: '280px 280px',
          backgroundRepeat: 'repeat',
          color: 'var(--border)',
        }}
      />

      <div className="relative z-10 w-full max-w-xl">
        {/* Header with 3D subtle badge */}
        <FadeIn y={-16} duration={0.5} className="text-center mb-8">
          <h1
            className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight mb-2"
            style={{ color: 'var(--text-primary)' }}
          >
            {t(lang, 'onboarding.title')}
          </h1>
          <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            {t(lang, 'onboarding.subtitle')}
          </p>
        </FadeIn>

        {/* 3D Step Indicators */}
        <FadeIn delay={0.1} y={0} className="flex items-center justify-center gap-2 mb-6">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.id}
              onClick={() => {
                if (i < currentStep) {
                  setDirection(-1);
                  setCurrentStep(i);
                }
              }}
              className={`h-2 rounded-full cursor-pointer transition-all duration-300 relative overflow-hidden ${
                i <= currentStep ? 'shadow-sm' : ''
              }`}
              animate={{
                width: i === currentStep ? 36 : 8,
                backgroundColor:
                  i < currentStep
                    ? 'var(--accent)'
                    : i === currentStep
                    ? 'var(--accent)'
                    : 'var(--border-strong)',
                opacity: i > currentStep ? 0.35 : 1,
              }}
            >
              {i < currentStep && (
                <div className="absolute inset-0 bg-white/25 animate-pulse" />
              )}
            </motion.div>
          ))}
        </FadeIn>

        {/* Progress bar with percentage */}
        <FadeIn delay={0.15} y={0} className="mb-6">
          <div className="flex items-center justify-between mb-1.5 px-1">
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Step {currentStep + 1} of {STEPS.length}
            </span>
            <span className="text-xs font-bold font-mono" style={{ color: 'var(--accent)' }}>
              {Math.round(progress)}% Completed
            </span>
          </div>
          <Progress value={progress} />
        </FadeIn>

        {/* 3D Card with Tilt Effect */}
        <Card3DTilt intensity={8} glareOpacity={0.12}>
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentStep}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              <div
                className="rounded-3xl border p-7 sm:p-9 backdrop-blur-xl relative overflow-hidden"
                style={{
                  backgroundColor: 'var(--surface-0)',
                  borderColor: 'var(--border)',
                  boxShadow: '0 20px 50px -10px rgba(0, 0, 0, 0.1), 0 10px 20px -5px rgba(0, 0, 0, 0.04)',
                }}
              >
                {/* Subtle top specular border highlight */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent opacity-60" />

                {/* 3D Visual Icon + Title Area */}
                <div className="flex items-start gap-4 mb-6">
                  <ThreeDIcon
                    name={currentStepData.iconName}
                    variant={currentStepData.variant}
                    size="lg"
                  />
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-widest text-[var(--accent)] mb-1 block">
                      Step {currentStep + 1}
                    </span>
                    <h2 className="text-2xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
                      {currentStepData.title}
                    </h2>
                    <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                      {currentStepData.description}
                    </p>
                  </div>
                </div>

                {/* Input Field Area */}
                <div className="space-y-2 mb-8">
                  <label
                    className="text-sm font-bold block"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {currentStepData.question}
                  </label>
                  <div className="relative">
                    <Input
                      type={currentStepData.type === 'number' ? 'number' : 'text'}
                      placeholder={currentStepData.placeholder}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      disabled={isLoading}
                      onKeyDown={(e) => e.key === 'Enter' && handleNext()}
                      className="h-14 text-base px-4 rounded-2xl shadow-inner bg-[var(--surface-1)] border-[var(--border)] focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/10 font-medium"
                      autoFocus
                    />
                  </div>
                  <p className="text-xs flex items-center gap-1.5 pt-1" style={{ color: 'var(--text-muted)' }}>
                    <span>Press</span>
                    <kbd
                      className="px-2 py-0.5 rounded-md text-[11px] font-mono border shadow-xs"
                      style={{
                        borderColor: 'var(--border-strong)',
                        backgroundColor: 'var(--surface-2)',
                        color: 'var(--text-primary)',
                      }}
                    >
                      Enter ↵
                    </kbd>
                    <span>to proceed</span>
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between items-center pt-2 border-t border-[var(--border)]">
                  <div>
                    {currentStep > 0 ? (
                      <Button
                        variant="ghost"
                        onClick={handleBack}
                        disabled={isLoading}
                        size="sm"
                        className="gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-xl"
                      >
                        <ArrowLeft size={16} />
                        Back
                      </Button>
                    ) : (
                      <div />
                    )}
                  </div>

                  <Button
                    variant="primary"
                    onClick={handleNext}
                    disabled={isLoading || (!inputValue.trim() && currentStepData.id !== 'targetInvestment')}
                    className="gap-2 min-w-[130px] h-11 px-6 rounded-2xl shadow-lg hover:shadow-xl transition-all"
                  >
                    <AnimatePresence mode="wait">
                      {isLoading ? (
                        <motion.span
                          key="loading"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center gap-2"
                        >
                          <Loader2 size={16} className="animate-spin" />
                          Analyzing…
                        </motion.span>
                      ) : (
                        <motion.span
                          key="idle"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center gap-2"
                        >
                          {isLastStep ? 'Analyze Now' : 'Continue'}
                          {isLastStep ? <Sparkles size={16} /> : <ArrowRight size={16} />}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </Button>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </Card3DTilt>
      </div>
    </div>
  );
}
