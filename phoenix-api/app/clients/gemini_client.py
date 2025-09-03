import google.generativeai as genai
from app.core.config import settings
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AIServiceError(Exception):
    """Custom exception for AI service errors."""
    pass

class GeminiClient:
    def __init__(self):
        if not settings.GEMINI_API_KEY:
            logger.error("GEMINI_API_KEY not found in settings.")
            raise ValueError("GEMINI_API_KEY must be set")
        
        genai.configure(api_key=settings.GEMINI_API_KEY)
        self.model = genai.GenerativeModel('gemini-1.5-flash')
        logger.info("GeminiClient initialized successfully.")

    async def generate_content(self, prompt: str) -> str:
        """Generates content using Gemini with error handling."""
        try:
            # Note: The google-generativeai library handles async operations internally
            # when using generate_content_async.
            response = await self.model.generate_content_async(prompt)
            logger.info("Successfully generated content from Gemini.")
            return response.text
        except Exception as e:
            logger.error(f"An error occurred with the Gemini API: {e}")
            raise AIServiceError(f"Failed to generate content from Gemini: {e}")

# Singleton instance of the client
gemini_client = GeminiClient()

def get_gemini_client() -> GeminiClient:
    """FastAPI dependency to get GeminiClient instance"""
    return gemini_client
