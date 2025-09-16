from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # Luna Hub configuration - Railway will override via env vars
    LUNA_HUB_URL: str = "https://luna-hub-production.up.railway.app"
    LUNA_HUB_INTERNAL_API_KEY: str = "your-internal-secret-key"

    # AI Services configuration
    GEMINI_API_KEY: str = "YOUR_GEMINI_API_KEY_HERE"

    # JWT settings - Must match Luna Hub for token validation
    JWT_SECRET_KEY: str = "phoenix_luna_session_zero_enterprise_auth_system_jwt_secret_2024"
    JWT_ALGORITHM: str = "HS256"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding='utf-8')

settings = Settings()
