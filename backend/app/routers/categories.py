import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from app.database import get_db, now_iso
from app.schemas import (
    CategoryCreate, CategoryUpdate, CategoryOut,
    CategorySuggestRequest, CategorySuggestResponse, CategoryFeedbackRequest
)
from app.services.categorization_service import CategorizationService

router = APIRouter(prefix="/api/categories", tags=["Categories"])

@router.get("", response_model=List[CategoryOut])
def list_categories(db = Depends(get_db)):
    cur = db.cursor()
    cur.execute("""
        SELECT c.id, c.name, c.description, c.color, c.icon, c.is_system, c.created_at,
               COUNT(n.id) as notes_count
        FROM categories c
        LEFT JOIN notes n ON n.category_id = c.id AND n.is_deleted = 0
        GROUP BY c.id
        ORDER BY c.is_system DESC, c.name ASC
    """)
    rows = cur.fetchall()
    return [
        CategoryOut(
            id=r["id"],
            name=r["name"],
            description=r["description"] or "",
            color=r["color"],
            icon=r["icon"],
            is_system=bool(r["is_system"]),
            notes_count=r["notes_count"],
            created_at=r["created_at"]
        )
        for r in rows
    ]

@router.post("", response_model=CategoryOut)
def create_category(payload: CategoryCreate, db = Depends(get_db)):
    cur = db.cursor()
    cur.execute("SELECT id FROM categories WHERE LOWER(name) = LOWER(?)", (payload.name.strip(),))
    if cur.fetchone():
        raise HTTPException(status_code=400, detail="A category with this name already exists")

    cat_id = str(uuid.uuid4())
    now = now_iso()
    cur.execute("""
        INSERT INTO categories (id, name, description, color, icon, is_system, created_at)
        VALUES (?, ?, ?, ?, ?, 0, ?)
    """, (cat_id, payload.name.strip(), payload.description or "", payload.color or "#3B82F6", payload.icon or "Folder", now))
    db.commit()

    return CategoryOut(
        id=cat_id,
        name=payload.name.strip(),
        description=payload.description or "",
        color=payload.color or "#3B82F6",
        icon=payload.icon or "Folder",
        is_system=False,
        notes_count=0,
        created_at=now
    )

@router.put("/{cat_id}", response_model=CategoryOut)
def update_category(cat_id: str, payload: CategoryUpdate, db = Depends(get_db)):
    cur = db.cursor()
    cur.execute("SELECT * FROM categories WHERE id = ?", (cat_id,))
    existing = cur.fetchone()
    if not existing:
        raise HTTPException(status_code=404, detail="Category not found")

    updates = []
    params = []
    if payload.name is not None:
        updates.append("name = ?")
        params.append(payload.name.strip())
    if payload.description is not None:
        updates.append("description = ?")
        params.append(payload.description)
    if payload.color is not None:
        updates.append("color = ?")
        params.append(payload.color)
    if payload.icon is not None:
        updates.append("icon = ?")
        params.append(payload.icon)

    if updates:
        params.append(cat_id)
        cur.execute(f"UPDATE categories SET {', '.join(updates)} WHERE id = ?", params)
        db.commit()

    return list_categories(db)[0]  # Return updated list or fetch directly

@router.delete("/{cat_id}")
def delete_category(cat_id: str, db = Depends(get_db)):
    cur = db.cursor()
    cur.execute("SELECT is_system FROM categories WHERE id = ?", (cat_id,))
    row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Category not found")
    if row["is_system"]:
        raise HTTPException(status_code=400, detail="Cannot delete default system category")

    # Move notes to Uncategorized
    cur.execute("SELECT id FROM categories WHERE name = 'Uncategorized'")
    uncat = cur.fetchone()
    uncat_id = uncat["id"] if uncat else None

    cur.execute("UPDATE notes SET category_id = ? WHERE category_id = ?", (uncat_id, cat_id))
    cur.execute("DELETE FROM categories WHERE id = ?", (cat_id,))
    db.commit()

    return {"success": True, "message": "Category deleted; notes moved to Uncategorized."}

@router.post("/suggest", response_model=CategorySuggestResponse)
def suggest_category(payload: CategorySuggestRequest):
    """Suggest category and tags using hybrid rule-based and learned logic."""
    res = CategorizationService.suggest_category(payload.title, payload.content)
    return CategorySuggestResponse(**res)

@router.post("/feedback")
def record_category_feedback(payload: CategoryFeedbackRequest):
    """Store user correction to improve future categorisation predictions."""
    CategorizationService.record_user_correction(
        payload.note_title,
        payload.note_content,
        payload.predicted_category,
        payload.corrected_category
    )
    return {"success": True, "message": "Feedback recorded."}
