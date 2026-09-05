from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    """
    Application settings managed via environment variables.
    """
    # API Keys and URLs
    openai_api_key: Optional[str] = None
    openai_base_url: Optional[str] = None
    llm_model: str = "gpt-4o-mini"

    # Backend Config
    app_title: str = "GramNirnayAI Backend"
    app_debug: bool = False
    app_port: int = 8000
    app_host: str = "0.0.0.0"

    # Data paths
    data_dir: str = "data"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
