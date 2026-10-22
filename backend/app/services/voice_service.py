import os
import re
import shutil
import subprocess
import tempfile
from typing import Dict, Any, Optional
from app.config import settings

COMMAND_ALLOWLIST = [
    "create_note",
    "search",
    "generate_code",
    "switch_language",
    "categorize_note",
    "open_category",
    "save_note",
    "delete_note",
    "export_note",
    "dictate"
]

class VoiceService:
    @staticmethod
    def parse_command(transcript: str) -> Dict[str, Any]:
        """Parse natural speech transcript using strict command allowlist and parameter extraction."""
        text = transcript.strip().lower()
        if not text:
            return {
                "action": "unknown",
                "parameters": {},
                "requires_confirmation": False,
                "confirmation_message": None,
                "message": "Empty voice transcript."
            }

        # 1. Create New Note
        if re.search(r"\b(create|make|open)\s+(a\s+)?new\s+note\b", text) or text == "new note":
            return {
                "action": "create_note",
                "parameters": {},
                "requires_confirmation": False,
                "message": "Creating a new note."
            }

        # 2. Search Command
        search_match = re.search(r"\b(search for|search|find|lookup)\s+(?:my\s+)?(.+)", text)
        if search_match:
            query = search_match.group(2).strip()
            # Clean trailing words like "code", "notes"
            return {
                "action": "search",
                "parameters": {"query": query},
                "requires_confirmation": False,
                "message": f"Searching for '{query}'."
            }

        # 3. Generate Code Command
        gen_match = re.search(r"\bgenerate\s+([a-zA-Z\+\#]+)?\s*code\b", text)
        if gen_match or "generate code" in text or "convert to code" in text:
            raw_lang = gen_match.group(1) if gen_match and gen_match.group(1) else None
            lang = VoiceService._normalize_language(raw_lang) if raw_lang else None
            return {
                "action": "generate_code",
                "parameters": {"language": lang} if lang else {},
                "requires_confirmation": False,
                "message": f"Generating {lang or 'code'} from current instruction."
            }

        # 4. Switch Language Command
        switch_match = re.search(r"\b(?:switch|change|set)\s+(?:the\s+)?(?:programming\s+)?language\s+to\s+([a-zA-Z\+\#]+)", text)
        if switch_match:
            raw_lang = switch_match.group(1)
            lang = VoiceService._normalize_language(raw_lang)
            return {
                "action": "switch_language",
                "parameters": {"language": lang},
                "requires_confirmation": False,
                "message": f"Switched programming language to {lang}."
            }

        # 5. Categorize Note
        if re.search(r"\b(categorise|categorize|classify)\s+(this\s+|current\s+)?note\b", text):
            return {
                "action": "categorize_note",
                "parameters": {},
                "requires_confirmation": False,
                "message": "Analyzing and categorizing note."
            }

        # 6. Open Category Notes
        cat_match = re.search(r"\bopen\s+(?:my\s+)?(.+?)\s+notes\b", text)
        if cat_match:
            cat_name = cat_match.group(1).strip()
            return {
                "action": "open_category",
                "parameters": {"category": cat_name},
                "requires_confirmation": False,
                "message": f"Opening {cat_name} category."
            }

        # 7. Save Note
        if re.search(r"\bsave\s+(the\s+|current\s+|this\s+)?note\b", text):
            return {
                "action": "save_note",
                "parameters": {},
                "requires_confirmation": False,
                "message": "Saving current note."
            }

        # 8. Delete Note (Destructive - requires explicit confirmation)
        if re.search(r"\bdelete\s+(this\s+|current\s+)?note\b", text):
            return {
                "action": "delete_note",
                "parameters": {},
                "requires_confirmation": True,
                "confirmation_message": "Are you sure you want to delete this note? This action will move it to trash.",
                "message": "Delete note requested. Confirmation required."
            }

        # Default fallback: Treat as Dictation
        return {
            "action": "dictation",
            "parameters": {"text": transcript.strip()},
            "requires_confirmation": False,
            "message": "Dictation text recognized."
        }

    @staticmethod
    def _normalize_language(lang_str: Optional[str]) -> str:
        if not lang_str:
            return "python"
        clean = lang_str.lower().strip()
        if "c++" in clean or "cpp" in clean or "plus plus" in clean: return "cpp"
        if "c#" in clean or "csharp" in clean: return "csharp"
        if clean in ("c", "see"): return "c"
        if "python" in clean or "py" in clean: return "python"
        if "javascript" in clean or "js" in clean or "node" in clean: return "javascript"
        if "java" in clean: return "java"
        return clean

    @staticmethod
    def transcribe_audio_file(audio_bytes: bytes) -> Dict[str, Any]:
        """Transcribe audio bytes locally using whisper.cpp if present or whisper engine."""
        whisper_bin = settings.WHISPER_CPP_PATH or shutil.which("whisper-cli") or shutil.which("main")
        
        with tempfile.NamedTemporaryFile("wb", suffix=".wav", delete=False) as f:
            f.write(audio_bytes)
            wav_path = f.name

        try:
            if whisper_bin and os.path.exists(whisper_bin):
                # Run local whisper.cpp executable
                model_file = os.path.join(os.path.dirname(whisper_bin), f"ggml-{settings.WHISPER_MODEL}.bin")
                cmd = [whisper_bin, "-m", model_file, "-f", wav_path, "--no-timestamps"]
                proc = subprocess.run(cmd, capture_output=True, text=True, timeout=30.0)
                if proc.returncode == 0:
                    text = proc.stdout.strip()
                    return {"success": True, "transcript": text, "engine": "whisper.cpp"}
                else:
                    return {"success": False, "transcript": "", "error": proc.stderr.strip()}
            else:
                return {
                    "success": False,
                    "transcript": "",
                    "engine": "offline_pending",
                    "error": "whisper.cpp binary not detected. Please configure WHISPER_CPP_PATH or use client-side local recognition."
                }
        finally:
            if os.path.exists(wav_path):
                os.remove(wav_path)
