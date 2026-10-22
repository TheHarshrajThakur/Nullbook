import json
import logging
from typing import Dict, Any, List, Optional, Generator
import httpx
from app.config import settings

logger = logging.getLogger(__name__)

class OllamaService:
    def __init__(self, base_url: str = settings.OLLAMA_BASE_URL, default_model: str = settings.OLLAMA_MODEL):
        self.base_url = base_url.rstrip("/")
        self.default_model = default_model
        self.embed_model = settings.OLLAMA_EMBED_MODEL

    def check_health(self) -> Dict[str, Any]:
        """Check status of the local Ollama daemon and list installed models."""
        try:
            with httpx.Client(timeout=2.0) as client:
                res = client.get(f"{self.base_url}/api/tags")
                if res.status_code == 200:
                    data = res.json()
                    models = [m.get("name", "") for m in data.get("models", [])]
                    
                    # Check if our configured models are present
                    has_model = any(self.default_model in m for m in models)
                    status = "ready" if has_model else "not_installed"
                    
                    return {
                        "status": status,
                        "daemon_running": True,
                        "models": models,
                        "active_model": self.default_model,
                        "model_ready": has_model,
                        "message": "Local Ollama daemon is active." if has_model else f"Model '{self.default_model}' is not installed."
                    }
                else:
                    return {
                        "status": "unavailable",
                        "daemon_running": False,
                        "models": [],
                        "active_model": self.default_model,
                        "model_ready": False,
                        "message": f"Ollama returned HTTP {res.status_code}"
                    }
        except httpx.ConnectError:
            return {
                "status": "unavailable",
                "daemon_running": False,
                "models": [],
                "active_model": self.default_model,
                "model_ready": False,
                "message": "Local Ollama service is not running on port 11434."
            }
        except Exception as e:
            return {
                "status": "unavailable",
                "daemon_running": False,
                "models": [],
                "active_model": self.default_model,
                "model_ready": False,
                "message": str(e)
            }

    def generate(self, prompt: str, model: Optional[str] = None, system: Optional[str] = None, timeout: float = 90.0) -> str:
        """Execute non-streaming inference against the local Ollama instance."""
        target_model = model or self.default_model
        payload = {
            "model": target_model,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": 0.2,  # Low temperature for precise code generation
                "top_p": 0.9,
            }
        }
        if system:
            payload["system"] = system

        try:
            with httpx.Client(timeout=timeout) as client:
                res = client.post(f"{self.base_url}/api/generate", json=payload)
                if res.status_code == 200:
                    data = res.json()
                    return data.get("response", "")
                elif res.status_code == 404:
                    raise RuntimeError(f"Model '{target_model}' is not installed locally in Ollama.")
                else:
                    raise RuntimeError(f"Ollama generation failed with HTTP {res.status_code}: {res.text}")
        except httpx.ConnectError:
            raise RuntimeError("Cannot connect to local Ollama service. Ensure Ollama is running.")
        except httpx.ReadTimeout:
            raise RuntimeError(f"Local AI inference timed out after {timeout} seconds.")
        except Exception as e:
            logger.error(f"Ollama generation error: {e}")
            raise

    def generate_stream(self, prompt: str, model: Optional[str] = None, system: Optional[str] = None) -> Generator[str, None, None]:
        """Stream generated tokens from Ollama."""
        target_model = model or self.default_model
        payload = {
            "model": target_model,
            "prompt": prompt,
            "stream": True,
            "options": {
                "temperature": 0.2,
            }
        }
        if system:
            payload["system"] = system

        with httpx.Client(timeout=120.0) as client:
            with client.stream("POST", f"{self.base_url}/api/generate", json=payload) as response:
                if response.status_code != 200:
                    raise RuntimeError(f"Ollama stream error HTTP {response.status_code}")
                for line in response.iter_lines():
                    if line:
                        chunk = json.loads(line)
                        token = chunk.get("response", "")
                        if token:
                            yield token
                        if chunk.get("done", False):
                            break

    def get_embedding(self, text: str, model: Optional[str] = None) -> Optional[List[float]]:
        """Compute semantic embeddings for text using the local embedding model."""
        target_model = model or self.embed_model
        payload = {
            "model": target_model,
            "prompt": text.strip()
        }
        try:
            with httpx.Client(timeout=10.0) as client:
                res = client.post(f"{self.base_url}/api/embeddings", json=payload)
                if res.status_code == 200:
                    data = res.json()
                    return data.get("embedding", None)
                return None
        except Exception as e:
            logger.warning(f"Could not compute local embedding: {e}")
            return None

ollama_service = OllamaService()
