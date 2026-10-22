import sqlite3
import json
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Generator
from app.config import settings

DEFAULT_CATEGORIES = [
    ("Programming", "Code snippets, scripts, software development techniques", "#3B82F6", "Code"),
    ("Data Structures and Algorithms", "DSA concepts, complexity, algorithms, problem solving", "#10B981", "Binary"),
    ("Artificial Intelligence", "AI concepts, neural networks, LLMs, prompt engineering", "#8B5CF6", "Cpu"),
    ("Machine Learning", "ML models, datasets, training pipelines, evaluation", "#EC4899", "BarChart"),
    ("Cybersecurity", "Security notes, vulnerabilities, cryptography, network protocols", "#EF4444", "Shield"),
    ("Academics", "University courses, textbook summaries, exam notes", "#F59E0B", "GraduationCap"),
    ("Career Preparation", "Interview questions, resumes, system design prep, career tips", "#14B8A6", "Briefcase"),
    ("Project Ideas", "Brainstorming, software architecture ideas, side projects", "#6366F1", "Lightbulb"),
    ("Personal Notes", "Quick thoughts, daily logs, personal reflections", "#84CC16", "FileText"),
    ("Research", "Scientific papers, experimental results, literature reviews", "#06B6D4", "BookOpen"),
    ("Documentation", "API docs, architectural records, reference sheets", "#64748B", "FolderOpen"),
    ("Uncategorized", "Unsorted notes awaiting categorization", "#94A3B8", "Inbox"),
]

def get_db_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(settings.DB_PATH, timeout=15.0)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    conn.execute("PRAGMA journal_mode = WAL;")
    return conn

def get_db() -> Generator[sqlite3.Connection, None, None]:
    conn = get_db_connection()
    try:
        yield conn
    finally:
        conn.close()

def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

def sync_fts(conn: sqlite3.Connection, note_id: str):
    """Keep SQLite FTS5 table strictly synchronised with the note."""
    cur = conn.cursor()
    cur.execute("DELETE FROM notes_fts WHERE id = ?", (note_id,))
    
    cur.execute("""
        SELECT n.id, n.title, n.content, n.generated_code, n.tags, n.language, n.explanation, n.is_deleted,
               COALESCE(c.name, 'Uncategorized') as category_name
        FROM notes n
        LEFT JOIN categories c ON n.category_id = c.id
        WHERE n.id = ? AND n.is_deleted = 0
    """, (note_id,))
    row = cur.fetchone()
    if row:
        cur.execute("""
            INSERT INTO notes_fts(id, title, content, generated_code, tags, language, explanation, category_name)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            row["id"],
            row["title"] or "",
            row["content"] or "",
            row["generated_code"] or "",
            row["tags"] or "",
            row["language"] or "",
            row["explanation"] or "",
            row["category_name"] or ""
        ))
    conn.commit()

def init_db():
    conn = get_db_connection()
    cur = conn.cursor()

    # 1. Categories Table
    cur.execute("""
        CREATE TABLE IF NOT EXISTS categories (
            id TEXT PRIMARY KEY,
            name TEXT UNIQUE NOT NULL,
            description TEXT,
            color TEXT NOT NULL DEFAULT '#3B82F6',
            icon TEXT NOT NULL DEFAULT 'Folder',
            is_system INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL
        )
    """)

    # 2. Notes Table
    cur.execute("""
        CREATE TABLE IF NOT EXISTS notes (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            note_type TEXT NOT NULL DEFAULT 'auto',
            category_id TEXT,
            tags TEXT NOT NULL DEFAULT '[]',
            language TEXT NOT NULL DEFAULT 'python',
            generated_code TEXT DEFAULT '',
            explanation TEXT DEFAULT '',
            validation_status TEXT NOT NULL DEFAULT 'not_validated',
            is_favorite INTEGER NOT NULL DEFAULT 0,
            is_pinned INTEGER NOT NULL DEFAULT 0,
            is_deleted INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY(category_id) REFERENCES categories(id) ON DELETE SET NULL
        )
    """)

    # 3. Code Revisions Table (preserves full code history)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS revisions (
            id TEXT PRIMARY KEY,
            note_id TEXT NOT NULL,
            revision_number INTEGER NOT NULL,
            instruction TEXT NOT NULL,
            generated_code TEXT NOT NULL,
            language TEXT NOT NULL,
            explanation TEXT DEFAULT '',
            validation_status TEXT NOT NULL DEFAULT 'not_validated',
            created_at TEXT NOT NULL,
            FOREIGN KEY(note_id) REFERENCES notes(id) ON DELETE CASCADE
        )
    """)

    # 4. User Category Corrections Table (for learning)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS category_corrections (
            id TEXT PRIMARY KEY,
            note_title TEXT,
            note_content TEXT,
            predicted_category TEXT,
            corrected_category TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
    """)

    # 5. Application Settings Store
    cur.execute("""
        CREATE TABLE IF NOT EXISTS settings_store (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
    """)

    # 6. Unsaved Drafts Table (Auto-Save / Recovery)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS drafts (
            note_id TEXT PRIMARY KEY,
            title TEXT,
            content TEXT,
            generated_code TEXT,
            language TEXT,
            updated_at TEXT NOT NULL
        )
    """)

    # 7. Local Vector Embeddings Cache
    cur.execute("""
        CREATE TABLE IF NOT EXISTS vector_embeddings (
            note_id TEXT PRIMARY KEY,
            embedding TEXT NOT NULL,
            model_name TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY(note_id) REFERENCES notes(id) ON DELETE CASCADE
        )
    """)

    # 8. SQLite FTS5 Full-Text Search Table
    cur.execute("""
        CREATE VIRTUAL TABLE IF NOT EXISTS notes_fts USING fts5(
            id UNINDEXED,
            title,
            content,
            generated_code,
            tags,
            language,
            explanation,
            category_name
        )
    """)

    # Indexes
    cur.execute("CREATE INDEX IF NOT EXISTS idx_notes_updated_at ON notes(updated_at DESC);")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_notes_category ON notes(category_id);")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_notes_is_deleted ON notes(is_deleted);")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_revisions_note_id ON revisions(note_id, revision_number DESC);")

    # Seed Default Categories
    for name, desc, color, icon in DEFAULT_CATEGORIES:
        cur.execute("SELECT id FROM categories WHERE name = ?", (name,))
        if not cur.fetchone():
            cat_id = str(uuid.uuid4())
            cur.execute("""
                INSERT INTO categories (id, name, description, color, icon, is_system, created_at)
                VALUES (?, ?, ?, ?, ?, 1, ?)
            """, (cat_id, name, desc, color, icon, now_iso()))

    conn.commit()
    conn.close()
