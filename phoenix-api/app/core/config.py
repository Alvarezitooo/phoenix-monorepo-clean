from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # Luna Hub configuration - MUST be set via environment variables
    LUNA_HUB_URL: str
    LUNA_HUB_INTERNAL_API_KEY: str

    # AI Services configuration - MUST be set via environment variables
    GEMINI_API_KEY: str

    # JWT settings - MUST be set via environment variables to match Luna Hub
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding='utf-8')

settings = Settings()
