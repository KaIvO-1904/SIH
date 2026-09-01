from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import json
import os
from financial_engine import FinancialEngine
from rag_engine import RAGEngine
from interpreter import BusinessInterpreter

app = FastAPI(title="Gram-AI Backend")

# Enable CORS for the frontend to communicate with the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, replace with ["http://localhost:3000"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

fin_engine = FinancialEngine()
rag_engine = RAGEngine()
interpreter = BusinessInterpreter()

class UserProfile(BaseModel):
    location: dict
    businessIdea: str
    availableCapital: float
    experience: int
    targetInvestment: float

@app.get("/")
async def root():
    return {"message": "Welcome to Gram-AI API", "status": "online"}

@app.post("/api/analyze-viability")
async def analyze_viability(profile: UserProfile):
    # 1. AI Interpretation: Turn a text idea into financial numbers
    params = interpreter.interpret(profile.businessIdea, profile.availableCapital)

    # 2. Deterministic Calculation: Run the math
    # We override the setup_cost with user's target if they provided one
    params["setup_cost"] = profile.targetInvestment if profile.targetInvestment > 0 else params["setup_cost"]
    params["user_capital"] = profile.availableCapital

    financials = fin_engine.compute_full_model(params)

    # 3. RAG Matching: Find the right schemes for the funding gap
    schemes = rag_engine.get_best_schemes(profile.dict(), params)

    return {
        "viabilityScore": 75,
        "recommendation": "Proceed with Modification" if financials["is_viable"] else "Reconsider",
        "marketAnalysis": {
            "demand": 80,
            "competition": 60,
            "accessibility": 70
        },
        "financials": financials,
        "interpreter_reasoning": params.get("reasoning"),
        "modifications": ["Reduce initial scale based on projected cash flow"],
        "matchedSchemes": schemes
    }

@app.get("/api/demo/{scenario_id}")
async def get_demo_scenario(scenario_id: str):
    try:
        # Use absolute path to find data regardless of where the server is started
        import os
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        scenario_path = os.path.join(base_dir, "data", "demo_scenarios.json")

        with open(scenario_path, "r") as f:
            scenarios = json.load(f)

        if scenario_id not in scenarios:
            raise HTTPException(status_code=404, detail="Scenario not found")

        scenario = scenarios[scenario_id]

        # Run actual financial engine on the scenario data
        financials = fin_engine.compute_full_model(scenario["financial_params"])
        financials["user_capital"] = scenario["profile"]["availableCapital"]

        # Use RAG engine to find schemes for this scenario
        schemes = rag_engine.get_best_schemes(scenario["profile"], scenario["financial_params"])

        return {
            "profile": scenario["profile"],
            "marketAnalysis": scenario["market_proxies"],
            "financials": financials,
            "recommendation": "Proceed with Modification" if financials["is_viable"] else "Reconsider",
            "risks": scenario["ai_insights"]["risks"],
            "modifications": scenario["ai_insights"]["modifications"],
            "matchedSchemes": schemes
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
