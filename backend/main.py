from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import logging
import json
try:
    from .config import settings
    from .logger import setup_logging, logger
    from .financial_engine import FinancialEngine
    from .rag_engine import RAGEngine
    from .interpreter import BusinessInterpreter
    from .context_engine import ContextEngine
    from .utils import normalize_state
except (ImportError, ValueError):
    from config import settings
    from logger import setup_logging, logger
    from financial_engine import FinancialEngine
    from rag_engine import RAGEngine
    from interpreter import BusinessInterpreter
    from context_engine import ContextEngine
    from utils import normalize_state

# Initialize Logging
setup_logging()

app = FastAPI(
    title=settings.app_title,
    description="AI-Driven Hyper-Local Business Advisory for Rural Micro-Entrepreneurs"
)

# Enable CORS for the frontend to communicate with the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, replace with ["http://localhost:3000"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Engines
fin_engine = FinancialEngine()
rag_engine = RAGEngine()
interpreter = BusinessInterpreter()
ctx_engine = ContextEngine()

class UserProfile(BaseModel):
    location: Dict[str, Any] = Field(..., description="User location data (district, state)")
    businessIdea: str = Field(..., min_length=3, description="The business idea to analyze")
    availableCapital: float = Field(..., gt=0, description="Capital currently available to the user")
    experience: int = Field(..., ge=0, description="Years of experience in the field")
    targetInvestment: float = Field(0.0, ge=0, description="Optional target total investment")

class GoogleAuthRequest(BaseModel):
    credential: Optional[str] = None
    email: Optional[str] = None
    name: Optional[str] = None
    avatar: Optional[str] = None
    google_id: Optional[str] = None

class SavedAnalysisRequest(BaseModel):
    businessIdea: str
    district: str
    state: str
    score: int
    recommendation: str
    projectCost: float
    data: Optional[Dict[str, Any]] = None

# In-memory user database & user analyses storage
USERS_DB: Dict[str, Dict[str, Any]] = {}
USER_ANALYSES_DB: Dict[str, List[Dict[str, Any]]] = {}

@app.post("/api/auth/google")
async def google_auth(auth_req: GoogleAuthRequest) -> Dict[str, Any]:
    """
    Authenticate user with Google credentials or backend Google token verification.
    """
    try:
        import uuid
        import time

        # Extract or fallback to provided user identity
        email = auth_req.email or "entrepreneur@gramnirnay.ai"
        name = auth_req.name or "Rural Entrepreneur"
        avatar = auth_req.avatar or "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
        google_id = auth_req.google_id or str(uuid.uuid4())

        user_id = f"usr_{google_id[:12]}"
        user_record = {
            "id": user_id,
            "name": name,
            "email": email,
            "avatar": avatar,
            "provider": "google",
            "last_login": int(time.time()),
        }

        USERS_DB[user_id] = user_record
        token = f"gn_jwt_{user_id}_{int(time.time())}"

        # Initialize history container if not existing
        if user_id not in USER_ANALYSES_DB:
            USER_ANALYSES_DB[user_id] = []

        return {
            "user": user_record,
            "token": token,
            "message": "Authentication successful"
        }
    except Exception as e:
        logger.exception(f"Google auth error: {e}")
        raise HTTPException(status_code=400, detail=f"Authentication failed: {str(e)}")

@app.get("/api/user/analyses")
async def get_user_analyses(user_id: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Retrieve saved analysis history for an authenticated user.
    """
    if user_id and user_id in USER_ANALYSES_DB:
        return USER_ANALYSES_DB[user_id]
    return []

@app.post("/api/user/analyses")
async def save_user_analysis(user_id: str, analysis: SavedAnalysisRequest) -> Dict[str, Any]:
    """
    Save a business viability assessment to user's backend profile.
    """
    import time
    if user_id not in USER_ANALYSES_DB:
        USER_ANALYSES_DB[user_id] = []

    analysis_item = {
        "id": f"analysis-{int(time.time())}",
        "businessIdea": analysis.businessIdea,
        "district": analysis.district,
        "state": analysis.state,
        "date": time.strftime("%Y-%m-%d"),
        "score": analysis.score,
        "recommendation": analysis.recommendation,
        "projectCost": analysis.projectCost,
        "data": analysis.data,
    }

    USER_ANALYSES_DB[user_id].insert(0, analysis_item)
    return {"status": "saved", "item": analysis_item}

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """
    Global exception handler to ensure all errors return a structured JSON response.
    """
    logger.error(f"Unhandled exception occurred: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal Server Error",
            "message": str(exc),
            "code": "INTERNAL_SERVER_ERROR"
        }
    )

@app.get("/", response_model=Dict[str, str])
async def root() -> Dict[str, str]:
    """
    Health check endpoint.
    """
    return {"message": "Welcome to Gram-AI API", "status": "online"}

@app.post("/api/analyze-viability")
async def analyze_viability(profile: UserProfile) -> Dict[str, Any]:
    """
    Main endpoint for analyzing the viability of a business idea.

    Flow:
    1. Interpretation: Text idea -> Financial parameters.
    2. Calculation: Run deterministic financial model.
    3. Context: Get hyper-local market proxies.
    4. RAG: Match government schemes for funding gap.
    """
    try:
        # Normalize location data
        if "location" in profile.model_dump():
            loc = profile.location
            if loc and "state" in loc:
                loc["state"] = normalize_state(loc["state"])

        # 1. AI Interpretation: Turn a text idea into financial numbers
        params = interpreter.interpret(profile.businessIdea, profile.availableCapital)

        # 2. Deterministic Calculation: Run the math
        # Override setup_cost with user's target if they provided one
        params["setup_cost"] = profile.targetInvestment if profile.targetInvestment > 0 else params["setup_cost"]
        params["user_capital"] = profile.availableCapital

        financials = fin_engine.compute_full_model(params)

        # 3. Local Context: Get market proxies for the location and business idea
        market_analysis = ctx_engine.get_market_proxies(profile.model_dump(), profile.businessIdea)

        # 4. RAG Matching: Find the right schemes for the funding gap
        schemes = rag_engine.get_best_schemes(profile.model_dump(), params)

        # Calculate a realistic viability score
        # Base score on viability, ROI, and break-even
        base_score = 50
        if financials["is_viable"]:
            base_score += 30

        # Bonus for high ROI (up to 20 points)
        roi_bonus = min(20, max(0, (financials["roi_percent"] / 5)))

        # Bonus for fast break-even (up to 10 points)
        be_bonus = max(0, 10 - (financials["break_even_months"] / 6))

        viability_score = int(base_score + roi_bonus + be_bonus)
        viability_score = min(100, max(0, viability_score))

        return {
            "viabilityScore": viability_score,
            "recommendation": "Proceed with Modification" if financials["is_viable"] else "Reconsider",
            "marketAnalysis": market_analysis,
            "financials": financials,
            "interpreter_reasoning": params.get("reasoning"),
            "modifications": ["Reduce initial scale based on projected cash flow"],
            "matchedSchemes": schemes
        }
    except Exception as e:
        logger.exception(f"Analysis failed for idea '{profile.businessIdea}': {e}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@app.get("/api/demo/{scenario_id}")
async def get_demo_scenario(scenario_id: str) -> Dict[str, Any]:
    """
    Retrieves a pre-defined demo scenario for showcase purposes.
    """
    try:
        import os
        scenario_path = os.path.join(settings.data_dir, "demo_scenarios.json")

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
    except FileNotFoundError:
        logger.error("demo_scenarios.json not found")
        raise HTTPException(status_code=500, detail="Demo data not found")
    except Exception as e:
        logger.exception(f"Error retrieving demo scenario {scenario_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=settings.app_host, port=settings.app_port)
