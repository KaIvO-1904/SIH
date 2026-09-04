export const translations = {
  en: {
    onboarding: {
      title: "GramNirnay AI",
      subtitle: "Conversational Onboarding",
      send: "Send",
      analyzing: "Analyzing your profile...",
      voice_input: "Use voice input"
    },
    report: {
      title: "Analysis Report",
      subtitle: "Hyper-Local Business Intelligence",
      new_analysis: "Start New Analysis",
      sandbox_title: "Financial Sandbox",
      sandbox_subtitle: "Tweak parameters to see real-time viability",
      viability_score: "Viability Score",
      ai_insights: "AI Insights",
      context_reasoning: "Contextual Reasoning",
      roadmap_title: "Financing Roadmap"
    }
  },
  hi: {
    onboarding: {
      title: "ग्रामनिर्णय AI",
      subtitle: "संवादात्मक ऑनबोर्डिंग",
      send: "भेजें",
      analyzing: "आपके प्रोफाइल का विश्लेषण किया जा रहा है...",
      voice_input: "आवाज का उपयोग करें"
    },
    report: {
      title: "विश्लेषण रिपोर्ट",
      subtitle: "हाइपर-लोकल बिजनेस इंटेलिजेंस",
      new_analysis: "नया विश्लेषण शुरू करें",
      sandbox_title: "वित्तीय सैंडबॉक्स",
      sandbox_subtitle: "वास्तविक समय में व्यवहार्यता देखने के लिए मापदंडों को बदलें",
      viability_score: "व्यवहार्यता स्कोर",
      ai_insights: "AI अंतर्दृष्टि",
      context_reasoning: "संदर्भ तर्क",
      roadmap_title: "वित्तपोषण रोडमैप"
    }
  }
};

export type Language = 'en' | 'hi';

export function t(lang: Language, path: string) {
  const keys = path.split('.');
  let result: any = translations[lang];
  for (const key of keys) {
    if (result[key] === undefined) return path;
    result = result[key];
  }
  return result;
}
