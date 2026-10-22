import json
import os
import shutil
from datetime import datetime, timezone
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, Query
from app.config import settings
from app.database import get_db, now_iso, init_db
from app.schemas import SystemStatusResponse
from app.services.ollama_service import ollama_service

router = APIRouter(prefix="/api/system", tags=["System"])

@router.get("/status", response_model=SystemStatusResponse)
def get_system_status(db = Depends(get_db)):
    """Comprehensive health check across database, local AI model, and speech engine."""
    cur = db.cursor()
    cur.execute("SELECT COUNT(*) as cnt FROM notes WHERE is_deleted = 0")
    notes_count = cur.fetchone()["cnt"]

    ollama_info = ollama_service.check_health()
    whisper_present = bool(settings.WHISPER_CPP_PATH and os.path.exists(settings.WHISPER_CPP_PATH))

    return SystemStatusResponse(
        app_version=settings.APP_VERSION,
        database_ok=True,
        notes_count=notes_count,
        ollama_status=ollama_info.get("status", "unavailable"),
        ollama_models=ollama_info.get("models", []),
        active_coding_model=settings.OLLAMA_MODEL,
        active_embedding_model=settings.OLLAMA_EMBED_MODEL,
        whisper_status="ready" if whisper_present else "fallback",
        offline_mode=True
    )

@router.post("/backup")
def create_backup(db = Depends(get_db)):
    """Create timestamped local SQLite backup."""
    db_file = Path(settings.DB_PATH)
    if not db_file.exists():
        raise HTTPException(status_code=404, detail="Database file not found.")

    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    backup_filename = f"intellinote_backup_{timestamp}.db"
    backup_path = Path(settings.BACKUP_DIR) / backup_filename

    # Execute SQLite native backup
    cur = db.cursor()
    cur.execute("VACUUM INTO ?", (str(backup_path),))

    return {
        "success": True,
        "backup_file": backup_filename,
        "backup_path": str(backup_path),
        "created_at": now_iso()
    }

@router.post("/restore")
def restore_backup(backup_file: str = Query(...)):
    """Restore database from local backup file."""
    src = Path(settings.BACKUP_DIR) / backup_file
    if not src.exists():
        raise HTTPException(status_code=404, detail="Specified backup file does not exist.")

    dst = Path(settings.DB_PATH)
    shutil.copy2(src, dst)
    init_db()

    return {"success": True, "message": f"Database successfully restored from {backup_file}."}

@router.get("/settings")
def get_settings(db = Depends(get_db)):
    """Fetch stored application preferences."""
    cur = db.cursor()
    cur.execute("SELECT key, value FROM settings_store")
    rows = cur.fetchall()
    data = {r["key"]: r["value"] for r in rows}
    # Defaults
    if "ollama_model" not in data: data["ollama_model"] = settings.OLLAMA_MODEL
    if "ollama_url" not in data: data["ollama_url"] = settings.OLLAMA_BASE_URL
    if "theme" not in data: data["theme"] = "dark"
    if "default_language" not in data: data["default_language"] = "python"
    return data

@router.post("/settings")
def save_settings(payload: dict, db = Depends(get_db)):
    """Save application preferences."""
    cur = db.cursor()
    now = now_iso()
    for k, v in payload.items():
        cur.execute("""
            INSERT OR REPLACE INTO settings_store (key, value, updated_at)
            VALUES (?, ?, ?)
        """, (str(k), str(v), now))
    db.commit()

    # Apply in-memory if model changed
    if "ollama_model" in payload:
        settings.OLLAMA_MODEL = str(payload["ollama_model"])
        ollama_service.default_model = str(payload["ollama_model"])
    if "ollama_url" in payload:
        settings.OLLAMA_BASE_URL = str(payload["ollama_url"])
        ollama_service.base_url = str(payload["ollama_url"]).rstrip("/")

    return {"success": True, "message": "Settings updated successfully."}
