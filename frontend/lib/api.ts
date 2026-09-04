const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
import { UserProfile, AnalysisResult } from '@/types';

export async function analyzeViability(profile: UserProfile): Promise<AnalysisResult> {
  const response = await fetch(`${API_BASE_URL}/api/analyze-viability`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profile),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || errorData.message || `Server error: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

export async function getDemoScenario(scenarioId: string): Promise<AnalysisResult> {
  const response = await fetch(`${API_BASE_URL}/api/demo/${scenarioId}`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || errorData.message || `Server error: ${response.status} ${response.statusText}`);
  }
  return response.json();
}
