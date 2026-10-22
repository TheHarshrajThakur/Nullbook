import json
import math
from typing import List, Optional, Dict
from app.database import get_db_connection, now_iso
from app.services.ollama_service import ollama_service

class EmbeddingService:
    @staticmethod
    def cosine_similarity(vec_a: List[float], vec_b: List[float]) -> float:
        """Compute cosine similarity between two float vectors."""
        if not vec_a or not vec_b or len(vec_a) != len(vec_b):
            return 0.0
        dot_product = sum(a * b for a, b in zip(vec_a, vec_b))
        norm_a = math.sqrt(sum(a * a for a in vec_a))
        norm_b = math.sqrt(sum(b * b for b in vec_b))
        if norm_a == 0.0 or norm_b == 0.0:
            return 0.0
        return dot_product / (norm_a * norm_b)

    @staticmethod
    def get_or_create_note_embedding(note_id: str, text: str) -> Optional[List[float]]:
        """Fetch cached embedding from SQLite or generate via Ollama and cache."""
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT embedding FROM vector_embeddings WHERE note_id = ?", (note_id,))
        row = cur.fetchone()
        if row:
            conn.close()
            try:
                return json.loads(row["embedding"])
            except Exception:
                pass

        # Generate new embedding
        emb = ollama_service.get_embedding(text)
        if emb:
            cur.execute("""
                INSERT OR REPLACE INTO vector_embeddings (note_id, embedding, model_name, updated_at)
                VALUES (?, ?, ?, ?)
            """, (note_id, json.dumps(emb), ollama_service.embed_model, now_iso()))
            conn.commit()
        conn.close()
        return emb

    @staticmethod
    def get_query_embedding(query: str) -> Optional[List[float]]:
        """Compute embedding for search query."""
        return ollama_service.get_embedding(query)

    @staticmethod
    def get_all_embeddings() -> Dict[str, List[float]]:
        """Load all cached note embeddings."""
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT note_id, embedding FROM vector_embeddings")
        rows = cur.fetchall()
        conn.close()
        results = {}
        for r in rows:
            try:
                results[r["note_id"]] = json.loads(r["embedding"])
            except Exception:
                continue
        return results
