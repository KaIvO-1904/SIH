const API_BASE_URL = 'http://localhost:8000';

export async function analyzeViability(profile: any) {
  const response = await fetch(`${API_BASE_URL}/api/analyze-viability`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profile),
  });
  if (!response.ok) throw new Error('Network response was not ok');
  return response.json();
}

export async function getDemoScenario(scenarioId: string) {
  const response = await fetch(`${API_BASE_URL}/api/demo/${scenarioId}`);
  if (!response.ok) throw new Error('Network response was not ok');
  return response.json();
}
