import json
from typing import Dict, Any
from openai import OpenAI
import os

class BusinessInterpreter:
    """
    AI component that turns a natural language business idea into
    structured financial parameters for the Deterministic Engine.
    """

    def __init__(self):
        self.client = OpenAI(
            api_key=os.getenv("OPENAI_API_KEY"),
            base_url=os.getenv("OPENAI_BASE_URL")
        )
        self.model = os.getenv("LLM_MODEL", "gpt-4o-mini")

    def interpret(self, idea: str, available_capital: float) -> Dict[str, Any]:
        """
        Extracts financial estimates for any business idea.
        """
        prompt = (
            f"You are a Rural Business Analyst. The user wants to start a business: '{idea}'. "
            f"They have {available_capital} capital. \n\n"
            f"Provide realistic, conservative financial estimates for a micro-enterprise in rural India. "
            f"Return ONLY a JSON object with these keys: \n"
            f"- setup_cost: (Total investment required)\n"
            f"- monthly_revenue: (Estimated monthly sales)\n"
            f"- monthly_expenses: (Rent, power, labor, raw materials)\n"
            f"- interest_rate: (Typical rural loan rate, e.g., 9.0 to 12.0)\n"
            f"- tenure_years: (Typical loan term, e.g., 5)\n"
            f"- category: (e.g., 'dairy', 'poultry', 'retail', 'manufacturing')\n"
            f"- reasoning: (One sentence explaining the estimates)"
        )

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"}
            )
            return json.loads(response.choices[0].message.content)
        except Exception as e:
            print(f"Interpretation failed: {e}. Using safe defaults.")
            return {
                "setup_cost": available_capital * 3,
                "monthly_revenue": available_capital * 0.1,
                "monthly_expenses": available_capital * 0.05,
                "interest_rate": 10.0,
                "tenure_years": 5,
                "category": "general",
                "reasoning": "Using generic defaults due to AI failure."
            }
