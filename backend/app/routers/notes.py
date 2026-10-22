import json
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from app.database import get_db, now_iso, sync_fts
from app.schemas import NoteCreate, NoteUpdate, NoteOut, RevisionOut
from app.services.categorization_service import CategorizationService

router = APIRouter(prefix="/api/notes", tags=["Notes"])

@router.get("", response_model=List[NoteOut])
def list_notes(
    category_id: Optional[str] = None,
    favorite_only: bool = False,
    note_type: Optional[str] = None,
    db = Depends(get_db)
):
    sql = """
        SELECT n.id, n.title, n.content, n.note_type, n.category_id, n.tags, n.language,
               n.generated_code, n.explanation, n.validation_status, n.is_favorite, n.is_pinned,
               n.created_at, n.updated_at,
               COALESCE(c.name, 'Uncategorized') as category_name,
               COALESCE(c.color, '#94A3B8') as category_color,
               (SELECT COUNT(*) FROM revisions r WHERE r.note_id = n.id) as revisions_count
        FROM notes n
        LEFT JOIN categories c ON n.category_id = c.id
        WHERE n.is_deleted = 0
    """
    params = []
    if category_id:
        sql += " AND n.category_id = ?"
        params.append(category_id)
    if favorite_only:
        sql += " AND n.is_favorite = 1"
    if note_type and note_type != "all":
        sql += " AND n.note_type = ?"
        params.append(note_type)

    sql += " ORDER BY n.is_pinned DESC, n.updated_at DESC"
    cur = db.cursor()
    cur.execute(sql, params)
    rows = cur.fetchall()

    result = []
    for r in rows:
        tags = []
        try:
            tags = json.loads(r["tags"])
        except Exception:
            pass
        result.append(NoteOut(
            id=r["id"],
            title=r["title"],
            content=r["content"],
            note_type=r["note_type"],
            category_id=r["category_id"],
            category_name=r["category_name"],
            category_color=r["category_color"],
            tags=tags,
            language=r["language"],
            generated_code=r["generated_code"] or "",
            explanation=r["explanation"] or "",
            validation_status=r["validation_status"],
            is_favorite=bool(r["is_favorite"]),
            is_pinned=bool(r["is_pinned"]),
            revisions_count=r["revisions_count"],
            created_at=r["created_at"],
            updated_at=r["updated_at"]
        ))
    return result

@router.get("/{note_id}", response_model=NoteOut)
def get_note(note_id: str, db = Depends(get_db)):
    cur = db.cursor()
    cur.execute("""
        SELECT n.id, n.title, n.content, n.note_type, n.category_id, n.tags, n.language,
               n.generated_code, n.explanation, n.validation_status, n.is_favorite, n.is_pinned,
               n.created_at, n.updated_at,
               COALESCE(c.name, 'Uncategorized') as category_name,
               COALESCE(c.color, '#94A3B8') as category_color,
               (SELECT COUNT(*) FROM revisions r WHERE r.note_id = n.id) as revisions_count
        FROM notes n
        LEFT JOIN categories c ON n.category_id = c.id
        WHERE n.id = ? AND n.is_deleted = 0
    """, (note_id,))
    r = cur.fetchone()
    if not r:
        raise HTTPException(status_code=404, detail="Note not found")

    tags = []
    try:
        tags = json.loads(r["tags"])
    except Exception:
        pass

    return NoteOut(
        id=r["id"],
        title=r["title"],
        content=r["content"],
        note_type=r["note_type"],
        category_id=r["category_id"],
        category_name=r["category_name"],
        category_color=r["category_color"],
        tags=tags,
        language=r["language"],
        generated_code=r["generated_code"] or "",
        explanation=r["explanation"] or "",
        validation_status=r["validation_status"],
        is_favorite=bool(r["is_favorite"]),
        is_pinned=bool(r["is_pinned"]),
        revisions_count=r["revisions_count"],
        created_at=r["created_at"],
        updated_at=r["updated_at"]
    )

@router.post("", response_model=NoteOut)
def create_note(payload: NoteCreate, auto_categorize: bool = Query(True), db = Depends(get_db)):
    note_id = str(uuid.uuid4())
    now = now_iso()
    category_id = payload.category_id
    tags = payload.tags or []

    # Auto categorize if category not specified
    if auto_categorize and not category_id and (payload.title or payload.content):
        sug = CategorizationService.suggest_category(payload.title, payload.content)
        category_id = sug.get("suggested_category_id")
        if not tags and sug.get("suggested_tags"):
            tags = sug.get("suggested_tags")

    cur = db.cursor()
    cur.execute("""
        INSERT INTO notes (
            id, title, content, note_type, category_id, tags, language,
            generated_code, explanation, validation_status, is_favorite, is_pinned,
            is_deleted, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'not_validated', 0, 0, 0, ?, ?)
    """, (
        note_id,
        payload.title.strip() or "Untitled Note",
        payload.content,
        payload.note_type,
        category_id,
        json.dumps(tags),
        payload.language or "python",
        payload.generated_code or "",
        payload.explanation or "",
        now,
        now
    ))
    db.commit()

    # Sync FTS5 Index
    sync_fts(db, note_id)

    return get_note(note_id, db)

@router.put("/{note_id}", response_model=NoteOut)
def update_note(note_id: str, payload: NoteUpdate, db = Depends(get_db)):
    cur = db.cursor()
    cur.execute("SELECT id FROM notes WHERE id = ? AND is_deleted = 0", (note_id,))
    if not cur.fetchone():
        raise HTTPException(status_code=404, detail="Note not found")

    updates = []
    params = []
    
    if payload.title is not None:
        updates.append("title = ?")
        params.append(payload.title.strip() or "Untitled Note")
    if payload.content is not None:
        updates.append("content = ?")
        params.append(payload.content)
    if payload.note_type is not None:
        updates.append("note_type = ?")
        params.append(payload.note_type)
    if payload.category_id is not None:
        updates.append("category_id = ?")
        params.append(payload.category_id)
    if payload.tags is not None:
        updates.append("tags = ?")
        params.append(json.dumps(payload.tags))
    if payload.language is not None:
        updates.append("language = ?")
        params.append(payload.language)
    if payload.generated_code is not None:
        updates.append("generated_code = ?")
        params.append(payload.generated_code)
    if payload.explanation is not None:
        updates.append("explanation = ?")
        params.append(payload.explanation)
    if payload.validation_status is not None:
        updates.append("validation_status = ?")
        params.append(payload.validation_status)
    if payload.is_favorite is not None:
        updates.append("is_favorite = ?")
        params.append(1 if payload.is_favorite else 0)
    if payload.is_pinned is not None:
        updates.append("is_pinned = ?")
        params.append(1 if payload.is_pinned else 0)

    updates.append("updated_at = ?")
    params.append(now_iso())

    params.append(note_id)
    sql = f"UPDATE notes SET {', '.join(updates)} WHERE id = ?"
    cur.execute(sql, params)
    db.commit()

    sync_fts(db, note_id)
    return get_note(note_id, db)

@router.delete("/{note_id}")
def delete_note(note_id: str, db = Depends(get_db)):
    cur = db.cursor()
    cur.execute("UPDATE notes SET is_deleted = 1, updated_at = ? WHERE id = ?", (now_iso(), note_id))
    db.commit()
    sync_fts(db, note_id)
    return {"success": True, "message": "Note moved to trash."}

@router.post("/{note_id}/toggle-favorite")
def toggle_favorite(note_id: str, db = Depends(get_db)):
    cur = db.cursor()
    cur.execute("UPDATE notes SET is_favorite = ((is_favorite | 1) - (is_favorite & 1)), updated_at = ? WHERE id = ?", (now_iso(), note_id))
    db.commit()
    return get_note(note_id, db)

@router.get("/{note_id}/revisions", response_model=List[RevisionOut])
def get_note_revisions(note_id: str, db = Depends(get_db)):
    cur = db.cursor()
    cur.execute("""
        SELECT id, note_id, revision_number, instruction, generated_code, language, explanation, validation_status, created_at
        FROM revisions
        WHERE note_id = ?
        ORDER BY revision_number DESC
    """, (note_id,))
    rows = cur.fetchall()
    return [
        RevisionOut(
            id=r["id"],
            note_id=r["note_id"],
            revision_number=r["revision_number"],
            instruction=r["instruction"],
            generated_code=r["generated_code"],
            language=r["language"],
            explanation=r["explanation"] or "",
            validation_status=r["validation_status"],
            created_at=r["created_at"]
        )
        for r in rows
    ]

@router.post("/{note_id}/revisions/{revision_id}/restore", response_model=NoteOut)
def restore_revision(note_id: str, revision_id: str, db = Depends(get_db)):
    cur = db.cursor()
    cur.execute("SELECT * FROM revisions WHERE id = ? AND note_id = ?", (revision_id, note_id))
    rev = cur.fetchone()
    if not rev:
        raise HTTPException(status_code=404, detail="Revision not found")

    cur.execute("""
        UPDATE notes
        SET generated_code = ?, language = ?, explanation = ?, validation_status = ?, updated_at = ?
        WHERE id = ?
    """, (rev["generated_code"], rev["language"], rev["explanation"], rev["validation_status"], now_iso(), note_id))
    db.commit()
    sync_fts(db, note_id)
    return get_note(note_id, db)

# Drafts Auto-Save / Recovery
@router.post("/drafts/{note_id}")
def save_draft(note_id: str, data: dict, db = Depends(get_db)):
    cur = db.cursor()
    cur.execute("""
        INSERT OR REPLACE INTO drafts (note_id, title, content, generated_code, language, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (
        note_id,
        data.get("title", ""),
        data.get("content", ""),
        data.get("generated_code", ""),
        data.get("language", "python"),
        now_iso()
    ))
    db.commit()
    return {"status": "draft_saved"}

@router.get("/drafts/{note_id}")
def get_draft(note_id: str, db = Depends(get_db)):
    cur = db.cursor()
    cur.execute("SELECT * FROM drafts WHERE note_id = ?", (note_id,))
    row = cur.fetchone()
    if not row:
        return {"draft": None}
    return {"draft": dict(row)}

@router.delete("/drafts/{note_id}")
def clear_draft(note_id: str, db = Depends(get_db)):
    cur = db.cursor()
    cur.execute("DELETE FROM drafts WHERE note_id = ?", (note_id,))
    db.commit()
    return {"status": "draft_cleared"}

# Export endpoint
@router.get("/{note_id}/export")
def export_note(note_id: str, export_format: str = Query("md"), db = Depends(get_db)):
    note = get_note(note_id, db)
    fmt = export_format.lower()

    if fmt in ("py", "js", "java", "c", "cpp"):
        content = note.generated_code or note.content
        filename = f"{note.title.replace(' ', '_')}.{fmt}"
        media_type = "text/plain"
    elif fmt == "txt":
        content = f"Title: {note.title}\nCategory: {note.category_name}\nTags: {', '.join(note.tags)}\n\n--- Content ---\n{note.content}\n\n--- Generated Code ({note.language}) ---\n{note.generated_code}\n\n--- Explanation ---\n{note.explanation}\n"
        filename = f"{note.title.replace(' ', '_')}.txt"
        media_type = "text/plain"
    else:  # markdown default
        content = f"# {note.title}\n\n**Category:** {note.category_name} | **Language:** {note.language} | **Tags:** {', '.join(note.tags)}\n\n## Description / Instruction\n{note.content}\n\n## Generated Code\n```{note.language}\n{note.generated_code}\n```\n\n## Explanation\n{note.explanation}\n"
        filename = f"{note.title.replace(' ', '_')}.md"
        media_type = "text/markdown"

    headers = {"Content-Disposition": f'attachment; filename="{filename}"'}
    return Response(content=content, media_type=media_type, headers=headers)
