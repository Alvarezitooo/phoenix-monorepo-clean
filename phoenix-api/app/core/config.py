from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # Luna Hub configuration
    LUNA_HUB_URL: str = "http://localhost:8003" # Default for local dev
    LUNA_HUB_INTERNAL_API_KEY: str = "your-internal-secret-key"

    # AI Services configuration
    GEMINI_API_KEY: str = "YOUR_GEMINI_API_KEY_HERE"

    # JWT settings
    JWT_SECRET_KEY: str = "a_very_secret_key_that_should_be_in_env_file"
    JWT_ALGORITHM: str = "HS256"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding='utf-8')

settings = Settings()
