'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { generateQuestions, analyzeViability } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/lib/LanguageContext';
import { useApp } from '@/lib/AppContext';
import { t } from '@/lib/i18n';
import { UserProfile, DynamicQuestion, QuestionnaireResponse } from '@/types';
import { FadeIn } from '@/components/motion';
import ThreeDIcon from '@/components/3d/ThreeDIcons';
import Card3DTilt from '@/components/3d/Card3DTilt';
import Questionnaire3DCanvas from '@/components/3d/Questionnaire3DCanvas';
import {
  ArrowRight,
  ArrowLeft,
  Loader2,
  Sparkles,
  Check,
  Edit3,
  Building2,
  MapPin,
  Calendar,
  Compass,
} from 'lucide-react';

const SUGGESTED_IDEAS = [
  { label: 'Broiler Poultry Farm', query: 'Broiler Poultry Farm' },
  { label: 'Apparel & Saree Store', query: 'Cloth & Saree Store' },
  { label: 'Commercial Dairy Farm', query: 'Dairy Farm with Cows' },
  { label: 'Kirana & FMCG Store', query: 'Kirana & Grocery Store' },
  { label: 'Agro-Inputs & Seeds', query: 'Fertilizer and Seed Store' },
  { label: 'Goat Breeding Unit', query: 'Goat and Sheep Husbandry' },
];

export default function ProfilePage() {
  const { lang } = useLanguage();
  const { addHistoryItem } = useApp();
  const router = useRouter();

  // Primary Venture Info
  const [businessIdea, setBusinessIdea] = useState('');
  const [district, setDistrict] = useState('');
  const [stateName, setStateName] = useState('');
  const [experience, setExperience] = useState('2');

  // Dynamic Questionnaire State
  const [stage, setStage] = useState<'initial' | 'loading_questions' | 'answering_questions' | 'analyzing'>('initial');
  const [questionnaireData, setQuestionnaireData] = useState<QuestionnaireResponse | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [customAnswers, setCustomAnswers] = useState<Record<string, string>>({});
  const [isCustomActive, setIsCustomActive] = useState<Record<string, boolean>>({});
  const [errorMsg, setErrorMsg] = useState('');

  // ── 1. Fetch Dynamic Questions for Idea ──
  const handleStartQuestionnaire = async () => {
    if (!businessIdea.trim()) {
      setErrorMsg('Please enter your business idea to continue.');
      return;
    }
    if (!district.trim()) {
      setErrorMsg('Please enter your district name.');
      return;
    }
    if (!stateName.trim()) {
      setErrorMsg('Please enter your state name.');
      return;
    }

    setErrorMsg('');
    setStage('loading_questions');

    try {
      const qRes = await generateQuestions(businessIdea, {
        district: district.trim(),
        state: stateName.trim(),
      });
      setQuestionnaireData(qRes);

      // Pre-populate default first options
      const initialAnswers: Record<string, string> = {};
      qRes.questions.forEach((q) => {
        if (q.options && q.options.length > 0) {
          initialAnswers[q.id] = q.options[0].value;
        }
      });
      setAnswers(initialAnswers);
      setCurrentQuestionIndex(0);
      setStage('answering_questions');
    } catch (e: any) {
      console.error('Question generation failed, continuing to direct analysis:', e);
      await submitDirectAnalysis({});
    }
  };

  // ── 2. Handle Option Selection ──
  const handleSelectOption = (questionId: string, value: string) => {
    setIsCustomActive((prev) => ({ ...prev, [questionId]: false }));
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSelectCustom = (questionId: string) => {
    setIsCustomActive((prev) => ({ ...prev, [questionId]: true }));
    const currentVal = customAnswers[questionId] || '';
    setAnswers((prev) => ({ ...prev, [questionId]: currentVal || 'Custom Option' }));
  };

  const handleCustomInputChange = (questionId: string, text: string) => {
    setCustomAnswers((prev) => ({ ...prev, [questionId]: text }));
    setAnswers((prev) => ({ ...prev, [questionId]: text.trim() || 'Custom Option' }));
  };

  const handleNextQuestion = async () => {
    if (!questionnaireData) return;

    if (currentQuestionIndex < questionnaireData.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      await submitDirectAnalysis(answers);
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    } else {
      setStage('initial');
    }
  };

  // ── 3. Final Viability Submission ──
  const submitDirectAnalysis = async (collectedAnswers: Record<string, string>) => {
    setStage('analyzing');
    try {
      const profilePayload: UserProfile = {
        businessIdea: businessIdea.trim(),
        location: {
          district: district.trim(),
          state: stateName.trim(),
          lat: 0,
          lng: 0,
        },
        experience: parseInt(experience, 10) || 0,
        availableCapital: 0,
        answers: collectedAnswers,
      };

      const result = await analyzeViability(profilePayload);
      localStorage.setItem('analysis_result', JSON.stringify(result));

      addHistoryItem({
        businessIdea: profilePayload.businessIdea,
        district: profilePayload.location.district,
        state: profilePayload.location.state,
        score: result.viabilityScore || 85,
        recommendation: result.recommendation || 'Proceed with Modification',
        projectCost: result.financials?.total_project_cost || 450000,
        data: result,
      });

      router.push('/report');
    } catch (e: any) {
      alert(e.message || 'Analysis failed. Please ensure the backend server is running.');
      setStage('answering_questions');
    }
  };

  const currentQ: DynamicQuestion | undefined = questionnaireData?.questions[currentQuestionIndex];
  const totalQuestions = questionnaireData?.questions.length || 1;
  const progressPercent = stage === 'answering_questions'
    ? Math.round(((currentQuestionIndex + 1) / totalQuestions) * 100)
    : 15;

  // Question 3D Icon selector
  const getQuestion3DIcon = (idx: number, cat?: string) => {
    const icons: Array<{ name: any; variant: any }> = [
      { name: 'idea', variant: 'blue' },
      { name: 'target', variant: 'amber' },
      { name: 'cart', variant: 'emerald' },
      { name: 'trending', variant: 'purple' },
      { name: 'sparkles', variant: 'cyan' },
      { name: 'shield', variant: 'indigo' },
    ];
    return icons[idx % icons.length];
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 py-20 relative overflow-hidden"
      style={{ backgroundColor: 'var(--surface-1)', color: 'var(--text-primary)' }}
    >
      {/* 3D Ambient background lighting */}
      <div className="pointer-events-none fixed inset-0 opacity-40">
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full blur-3xl"
          style={{
            background: 'radial-gradient(circle, color-mix(in srgb, var(--accent) 16%, transparent) 0%, transparent 70%)',
          }}
        />
        <div
          className="absolute bottom-10 right-10 w-[500px] h-[500px] rounded-full blur-3xl"
          style={{
            background: 'radial-gradient(circle, color-mix(in srgb, #6366f1 14%, transparent) 0%, transparent 70%)',
          }}
        />
      </div>

      <div
        className="pointer-events-none fixed inset-0 opacity-25"
        style={{
          backgroundImage: 'url(/media/grid-pattern.svg)',
          backgroundSize: '280px 280px',
          backgroundRepeat: 'repeat',
          color: 'var(--border)',
        }}
      />

      <div className="relative z-10 w-full max-w-2xl">
        {/* Header */}
        <FadeIn y={-16} duration={0.5} className="text-center mb-6">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight mb-2" style={{ color: 'var(--text-primary)' }}>
            Configure Your Venture
          </h1>
          <p className="text-sm sm:text-base font-medium" style={{ color: 'var(--text-secondary)' }}>
            We calculate required capital, projected profits, and funding schemes automatically.
          </p>
        </FadeIn>

        {/* Progress bar with 3D status badge */}
        {stage === 'answering_questions' && (
          <FadeIn delay={0.1} y={0} className="mb-6">
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                <Compass size={14} className="text-[var(--accent)]" />
                <span>Question {currentQuestionIndex + 1} of {totalQuestions}</span>
              </span>
              <span className="text-xs font-black font-mono px-2.5 py-0.5 rounded-full bg-[var(--accent-subtle)] text-[var(--accent-text)] border border-[var(--accent)]/20 shadow-xs">
                {progressPercent}% Completed
              </span>
            </div>
            <Progress value={progressPercent} />
          </FadeIn>
        )}

        {/* Main 3D Card with Tilt */}
        <Card3DTilt intensity={stage === 'answering_questions' ? 2 : 3} glareOpacity={0.06}>
          <div
            className="rounded-3xl border p-7 sm:p-9 backdrop-blur-xl relative overflow-hidden"
            style={{
              backgroundColor: 'var(--surface-0)',
              borderColor: 'var(--border)',
              boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.08), 0 10px 25px -5px rgba(0, 0, 0, 0.04)',
            }}
          >
            {/* Top glowing accent line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent opacity-80" />

            {/* ── STAGE 1: INITIAL SETUP ── */}
            {stage === 'initial' && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="space-y-6"
              >
                <div className="flex items-start gap-4 mb-2">
                  <ThreeDIcon name="idea" variant="blue" size="lg" />
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-widest text-[var(--accent)] mb-1 block">
                      Phase 1: Venture & Geography
                    </span>
                    <h2 className="text-2xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
                      What business are you planning?
                    </h2>
                    <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                      Specify your enterprise name, district, and experience level.
                    </p>
                  </div>
                </div>

                {/* Business Idea Input */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] flex items-center gap-1.5">
                    <Building2 size={14} className="text-[var(--accent)]" />
                    <span>Business Idea / Enterprise Name</span>
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g. Saree & Ready-made Garment Store, Broiler Poultry Unit, Dairy Farm"
                    value={businessIdea}
                    onChange={(e) => setBusinessIdea(e.target.value)}
                    className="h-13 text-base px-4 rounded-2xl shadow-inner bg-[var(--surface-1)] border-[var(--border)] focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/10 font-medium"
                  />
                  {/* Quick suggestion tags */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {SUGGESTED_IDEAS.map((item) => (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => setBusinessIdea(item.query)}
                        className="text-[11px] font-semibold px-3 py-1.5 rounded-xl border transition-all cursor-pointer bg-[var(--surface-1)] hover:bg-[var(--surface-2)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border-[var(--border)] hover:border-[var(--accent)]/40 shadow-xs"
                      >
                        + {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* District & State */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] flex items-center gap-1.5">
                      <MapPin size={14} className="text-[var(--accent)]" />
                      <span>District</span>
                    </label>
                    <Input
                      type="text"
                      placeholder="e.g. Ramanagara, Surat, Pune"
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      className="h-12 text-sm px-4 rounded-xl shadow-inner bg-[var(--surface-1)] border-[var(--border)]"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] flex items-center gap-1.5">
                      <MapPin size={14} className="text-[var(--accent)]" />
                      <span>State</span>
                    </label>
                    <Input
                      type="text"
                      placeholder="e.g. Karnataka, Gujarat, Maharashtra"
                      value={stateName}
                      onChange={(e) => setStateName(e.target.value)}
                      className="h-12 text-sm px-4 rounded-xl shadow-inner bg-[var(--surface-1)] border-[var(--border)]"
                    />
                  </div>
                </div>

                {/* Experience in years */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] flex items-center gap-1.5">
                    <Calendar size={14} className="text-[var(--accent)]" />
                    <span>Years of Relevant Experience</span>
                  </label>
                  <Input
                    type="number"
                    min="0"
                    max="40"
                    placeholder="e.g. 2"
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    className="h-12 text-sm px-4 rounded-xl shadow-inner bg-[var(--surface-1)] border-[var(--border)] font-medium"
                  />
                </div>

                {errorMsg && (
                  <p className="text-xs font-bold text-[var(--danger)] bg-[var(--danger-bg)] p-3.5 rounded-2xl border border-[var(--danger-border)]">
                    {errorMsg}
                  </p>
                )}

                {/* Continue button */}
                <div className="flex justify-end pt-3 border-t border-[var(--border)]">
                  <Button
                    variant="primary"
                    onClick={handleStartQuestionnaire}
                    className="gap-2 h-12 px-7 rounded-2xl shadow-lg hover:shadow-xl font-bold transition-all"
                  >
                    <span>Proceed to Questionnaire</span>
                    <ArrowRight size={16} />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* ── STAGE 2: LOADING QUESTIONS ── */}
            {stage === 'loading_questions' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-14 flex flex-col items-center justify-center text-center space-y-4"
              >
                <div className="w-16 h-16 rounded-3xl bg-[var(--accent-subtle)] border border-[var(--accent)]/30 flex items-center justify-center shadow-lg relative">
                  <Loader2 size={32} className="animate-spin text-[var(--accent)]" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>
                    Generating Tailored Questionnaire…
                  </h3>
                  <p className="text-xs max-w-sm text-[var(--text-secondary)]">
                    Calibrating operational parameters, unit economics, and local market proxies for{' '}
                    <span className="font-bold text-[var(--accent-text)]">{businessIdea}</span> in{' '}
                    <span className="font-bold">{district}, {stateName}</span>.
                  </p>
                </div>
              </motion.div>
            )}

            {/* ── STAGE 3: ANSWERING QUESTIONS WITH 3D ELEMENTS & CUSTOM OPTIONS ── */}
            {stage === 'answering_questions' && currentQ && (
              <motion.div
                key={currentQ.id}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-6"
              >
                {/* 3D Header Section with Live Three.js Geometry Canvas */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-[var(--surface-1)] border border-[var(--border)] relative overflow-hidden">
                  <div className="flex items-start gap-3.5 relative z-10">
                    <ThreeDIcon
                      name={getQuestion3DIcon(currentQuestionIndex, questionnaireData?.category).name}
                      variant={getQuestion3DIcon(currentQuestionIndex, questionnaireData?.category).variant}
                      size="lg"
                    />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-[var(--accent-subtle)] text-[var(--accent-text)] border border-[var(--accent)]/20">
                          Question {currentQuestionIndex + 1} of {totalQuestions}
                        </span>
                        <span className="text-xs font-semibold text-[var(--text-muted)]">
                          • {questionnaireData?.title || 'Operational Setup'}
                        </span>
                      </div>
                      <h2 className="text-lg sm:text-xl md:text-2xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
                        {currentQ.question}
                      </h2>
                    </div>
                  </div>

                  {/* 3D Canvas Orb Accent */}
                  <div className="shrink-0 hidden sm:flex items-center justify-center">
                    <Questionnaire3DCanvas
                      category={questionnaireData?.category || 'general'}
                      stepIndex={currentQuestionIndex}
                    />
                  </div>
                </div>

                {/* Options List (2-Column Responsive MCQ Grid) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {currentQ.options?.map((option, idx) => {
                    const isSelected = !isCustomActive[currentQ.id] && answers[currentQ.id] === option.value;
                    const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
                    const letter = letters[idx % letters.length];

                    return (
                      <div
                        key={option.value}
                        onClick={() => handleSelectOption(currentQ.id, option.value)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 relative overflow-hidden ${
                          isSelected
                            ? 'bg-[var(--accent-subtle)] border-[var(--accent)] shadow-md ring-2 ring-[var(--accent)]/20 translate-y-[-2px]'
                            : 'bg-[var(--surface-1)] border-[var(--border)] hover:border-[var(--accent)]/60 hover:bg-[var(--surface-2)] shadow-xs hover:translate-y-[-1px]'
                        }`}
                      >
                        {/* Top option header with Badge & Check */}
                        <div className="flex items-start justify-between gap-2">
                          <span
                            className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center font-mono transition-all ${
                              isSelected
                                ? 'bg-[var(--accent)] text-white shadow-xs'
                                : 'bg-[var(--surface-2)] text-[var(--text-secondary)] border border-[var(--border)]'
                            }`}
                          >
                            {letter}
                          </span>

                          <div
                            className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                              isSelected
                                ? 'bg-[var(--accent)] border-[var(--accent)] text-white shadow-xs'
                                : 'border-[var(--border-strong)] bg-[var(--surface-0)]'
                            }`}
                          >
                            {isSelected && <Check size={12} strokeWidth={3} className="text-white" />}
                          </div>
                        </div>

                        {/* Title & Description */}
                        <div className="space-y-1">
                          <div className="text-sm font-bold leading-snug" style={{ color: 'var(--text-primary)' }}>
                            {option.label}
                          </div>
                          {option.desc && (
                            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                              {option.desc}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* ── Custom Answer Option (if allow_custom is enabled) ── */}
                {currentQ.allow_custom && (
                  <div
                    className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer space-y-3 ${
                      isCustomActive[currentQ.id]
                        ? 'bg-[var(--accent-subtle)] border-[var(--accent)] shadow-md ring-2 ring-[var(--accent)]/20'
                        : 'bg-[var(--surface-1)] border-[var(--border)] hover:border-[var(--accent)]/60 hover:bg-[var(--surface-2)] shadow-xs'
                    }`}
                    onClick={() => handleSelectCustom(currentQ.id)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-[var(--surface-2)] flex items-center justify-center border border-[var(--border)] text-[var(--accent)]">
                          <Edit3 size={16} />
                        </div>
                        <div>
                          <div className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                            Custom Specification / Other Option
                          </div>
                          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                            Specify your exact target scale, capacity, or procurement method.
                          </p>
                        </div>
                      </div>

                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-1 transition-all ${
                          isCustomActive[currentQ.id]
                            ? 'bg-[var(--accent)] border-[var(--accent)] text-white shadow-xs'
                            : 'border-[var(--border-strong)] bg-[var(--surface-0)]'
                        }`}
                      >
                        {isCustomActive[currentQ.id] && <Check size={12} strokeWidth={3} className="text-white" />}
                      </div>
                    </div>

                    {/* Expandable Custom Input Field */}
                    {isCustomActive[currentQ.id] && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="pt-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Input
                          type="text"
                          placeholder="Type your custom answer (e.g. 3,500 flock capacity, Premium Kanchipuram Sarees, 750 sq.ft, etc.)"
                          value={customAnswers[currentQ.id] || ''}
                          onChange={(e) => handleCustomInputChange(currentQ.id, e.target.value)}
                          className="h-12 text-sm px-4 rounded-xl bg-[var(--surface-0)] border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/10 font-medium"
                          autoFocus
                        />
                      </motion.div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-between items-center pt-4 border-t border-[var(--border)]">
                  <Button
                    variant="ghost"
                    onClick={handlePrevQuestion}
                    size="sm"
                    className="gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-xl"
                  >
                    <ArrowLeft size={16} />
                    Back
                  </Button>

                  <Button
                    variant="primary"
                    onClick={handleNextQuestion}
                    className="gap-2 min-w-[150px] h-12 px-7 rounded-2xl shadow-lg hover:shadow-xl font-bold transition-all text-sm"
                  >
                    {currentQuestionIndex === totalQuestions - 1 ? (
                      <>
                        <span>Calculate Viability</span>
                        <Sparkles size={16} />
                      </>
                    ) : (
                      <>
                        <span>Continue</span>
                        <ArrowRight size={16} />
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            )}

            {/* ── STAGE 4: ANALYZING ── */}
            {stage === 'analyzing' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-14 flex flex-col items-center justify-center text-center space-y-5"
              >
                <div className="w-18 h-18 rounded-3xl bg-[var(--accent-subtle)] border border-[var(--accent)]/30 flex items-center justify-center shadow-xl">
                  <Loader2 size={36} className="animate-spin text-[var(--accent)]" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>
                    Synthesizing Financial Feasibility…
                  </h3>
                  <p className="text-xs max-w-md text-[var(--text-secondary)] leading-relaxed">
                    Computing required capital outlay, projected monthly sales, debt service coverage, and government subsidy eligibility for your venture.
                  </p>
                </div>
              </motion.div>
            )}
          </div>
        </Card3DTilt>
      </div>
    </div>
  );
}


