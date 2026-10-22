import os
from pathlib import Path
from pydantic import BaseModel

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)

class Settings(BaseModel):
    APP_NAME: str = "IntelliNote AI"
    APP_VERSION: str = "1.0.0"
    HOST: str = "127.0.0.1"
    PORT: int = 8765
    
    # Storage
    DB_PATH: str = str(DATA_DIR / "intellinote.db")
    BACKUP_DIR: str = str(DATA_DIR / "backups")
    EXPORT_DIR: str = str(DATA_DIR / "exports")
    
    # Local AI Services
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434")
    OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "qwen2.5-coder:1.5b")
    OLLAMA_EMBED_MODEL: str = os.getenv("OLLAMA_EMBED_MODEL", "nomic-embed-text")
    
    # Offline Voice
    WHISPER_MODEL: str = os.getenv("WHISPER_MODEL", "base")
    WHISPER_CPP_PATH: str = os.getenv("WHISPER_CPP_PATH", "")
    
    # Code Execution Sandbox
    SANDBOX_TIMEOUT_SECONDS: int = 5
    SANDBOX_MAX_OUTPUT_BYTES: int = 65536
    
    # Categorization Threshold
    CATEGORIZATION_CONFIDENCE_THRESHOLD: float = 0.40

settings = Settings()

# Ensure required directories exist
Path(settings.BACKUP_DIR).mkdir(parents=True, exist_ok=True)
Path(settings.EXPORT_DIR).mkdir(parents=True, exist_ok=True)
