export interface Location {
  district: string;
  state: string;
  lat?: number;
  lng?: number;
}

export interface UserProfile {
  location: Location;
  businessIdea: string;
  availableCapital: number;
  experience: number;
  targetInvestment: number;
}

export interface Financials {
  total_project_cost: number;
  financing_required: number;
  monthly_revenue: number;
  monthly_expenses: number;
  monthly_emi: number;
  monthly_net_profit: number;
  annual_net_profit: number;
  roi_percent: number;
  break_even_months: number;
  is_viable: boolean;
  user_capital?: number;
}

export interface MarketAnalysis {
  demand: number;
  competition: number;
  accessibility: number;
  seasonality: number;
  source: string;
  confidence: string;
  reasoning?: string;
}

export interface Scheme {
  schemeId: string;
  name: string;
  ministry: string;
  benefit: {
    subsidyPercent: number;
    loanAmount: number;
  };
  sourceUrl: string;
  eligibility: {
    minCapital: number;
    maxCapital: number;
    categories: string[];
  };
}

export interface AnalysisResult {
  viabilityScore: number;
  recommendation: string;
  marketAnalysis: MarketAnalysis;
  financials: Financials;
  interpreter_reasoning?: string;
  modifications: string[];
  matchedSchemes: Scheme[];
}
