import json
import re
from typing import List, Dict, Any, Optional
from app.database import get_db_connection
from app.services.embedding_service import EmbeddingService

def sanitize_fts_query(query: str) -> str:
    """Sanitize user query for SQLite FTS5 MATCH operator to prevent syntax errors."""
    clean = re.sub(r'[^\w\s]', ' ', query)
    tokens = clean.strip().split()
    if not tokens:
        return ""
    # Prefix match on each term: e.g. "binary* AND search*"
    return " AND ".join(f'"{t}"*' for t in tokens)

class SearchService:
    @staticmethod
    def search(
        query: str,
        category_id: Optional[str] = None,
        language: Optional[str] = None,
        tag: Optional[str] = None,
        search_type: str = "all",
        limit: int = 25
    ) -> List[Dict[str, Any]]:
        """Perform hybrid search combining SQLite FTS5 and semantic vector similarity."""
        query_clean = query.strip()
        conn = get_db_connection()
        cur = conn.cursor()

        # Step 1: Base Candidate Retrieval
        # If query is empty, return latest notes with filters
        if not query_clean:
            sql = """
                SELECT n.id, n.title, n.content, n.note_type, n.language, n.tags, n.updated_at,
                       COALESCE(c.name, 'Uncategorized') as category_name,
                       COALESCE(c.color, '#94A3B8') as category_color
                FROM notes n
                LEFT JOIN categories c ON n.category_id = c.id
                WHERE n.is_deleted = 0
            """
            params = []
            if category_id:
                sql += " AND n.category_id = ?"
                params.append(category_id)
            if language:
                sql += " AND n.language = ?"
                params.append(language)
            if tag:
                sql += " AND n.tags LIKE ?"
                params.append(f'%"{tag}"%')

            sql += " ORDER BY n.updated_at DESC LIMIT ?"
            params.append(limit)
            cur.execute(sql, params)
            rows = cur.fetchall()
            conn.close()

            return [
                {
                    "id": r["id"],
                    "title": r["title"],
                    "snippet": (r["content"][:160] + "...") if len(r["content"]) > 160 else r["content"],
                    "note_type": r["note_type"],
                    "category_name": r["category_name"],
                    "category_color": r["category_color"],
                    "language": r["language"],
                    "score": 1.0,
                    "match_type": "recent",
                    "updated_at": r["updated_at"]
                }
                for r in rows
            ]

        # Step 2: FTS5 Keyword Search
        fts_scores: Dict[str, Dict[str, Any]] = {}
        fts_query = sanitize_fts_query(query_clean)

        if fts_query and search_type in ("all", "keyword"):
            try:
                cur.execute("""
                    SELECT fts.id,
                           snippet(notes_fts, 1, '<mark>', '</mark>', '...', 16) as title_snippet,
                           snippet(notes_fts, 2, '<mark>', '</mark>', '...', 24) as content_snippet,
                           snippet(notes_fts, 3, '<mark>', '</mark>', '...', 20) as code_snippet,
                           bm25(notes_fts) as rank
                    FROM notes_fts fts
                    WHERE notes_fts MATCH ?
                    LIMIT ?
                """, (fts_query, limit * 2))
                fts_rows = cur.fetchall()

                for r in fts_rows:
                    nid = r["id"]
                    # Pick best available snippet
                    snippet = r["content_snippet"] or r["code_snippet"] or r["title_snippet"] or ""
                    # In FTS5 BM25, lower value is better (more negative). Convert to positive relevance score.
                    norm_score = max(0.1, 10.0 / (1.0 + abs(r["rank"])))
                    fts_scores[nid] = {
                        "score": norm_score,
                        "snippet": snippet,
                        "match_type": "fts_keyword"
                    }
            except Exception as e:
                # If FTS matching failed on special character, fallback gracefully
                pass

        # Step 3: Semantic Vector Search
        semantic_scores: Dict[str, float] = {}
        if search_type in ("all", "semantic"):
            query_embedding = EmbeddingService.get_query_embedding(query_clean)
            if query_embedding:
                all_embeddings = EmbeddingService.get_all_embeddings()
                for nid, note_emb in all_embeddings.items():
                    sim = EmbeddingService.cosine_similarity(query_embedding, note_emb)
                    if sim > 0.35:  # Relevance threshold
                        semantic_scores[nid] = sim * 10.0

        # Step 4: Fetch Note Details for All Candidate IDs
        candidate_ids = list(set(list(fts_scores.keys()) + list(semantic_scores.keys())))
        
        # Also include exact title substring matches if not already caught
        cur.execute("""
            SELECT id FROM notes
            WHERE is_deleted = 0 AND LOWER(title) LIKE LOWER(?)
        """, (f"%{query_clean}%",))
        for r in cur.fetchall():
            if r["id"] not in candidate_ids:
                candidate_ids.append(r["id"])

        if not candidate_ids:
            conn.close()
            return []

        placeholders = ",".join("?" for _ in candidate_ids)
        sql = f"""
            SELECT n.id, n.title, n.content, n.generated_code, n.note_type, n.language, n.tags, n.updated_at,
                   COALESCE(c.name, 'Uncategorized') as category_name,
                   COALESCE(c.color, '#94A3B8') as category_color
            FROM notes n
            LEFT JOIN categories c ON n.category_id = c.id
            WHERE n.id IN ({placeholders}) AND n.is_deleted = 0
        """
        params = list(candidate_ids)
        if category_id:
            sql += " AND n.category_id = ?"
            params.append(category_id)
        if language:
            sql += " AND n.language = ?"
            params.append(language)
        if tag:
            sql += " AND n.tags LIKE ?"
            params.append(f'%"{tag}"%')

        cur.execute(sql, params)
        matched_notes = cur.fetchall()
        conn.close()

        # Step 5: Score Fusion and Snippet Construction
        results = []
        for n in matched_notes:
            nid = n["id"]
            fts_info = fts_scores.get(nid, None)
            fts_score = fts_info["score"] if fts_info else 0.0
            sem_score = semantic_scores.get(nid, 0.0)

            # Title exact/substring match boost
            title_boost = 0.0
            if query_clean.lower() in n["title"].lower():
                title_boost = 8.0

            final_score = fts_score + sem_score + title_boost

            # Determine match type
            if fts_score > 0 and sem_score > 0:
                match_type = "hybrid"
            elif title_boost > 0 and fts_score == 0 and sem_score == 0:
                match_type = "exact_title"
            elif sem_score > 0:
                match_type = "semantic_vector"
            else:
                match_type = "fts_keyword"

            # Snippet selection
            if fts_info and fts_info["snippet"]:
                snippet = fts_info["snippet"]
            elif n["content"]:
                snippet = (n["content"][:160] + "...") if len(n["content"]) > 160 else n["content"]
            elif n["generated_code"]:
                snippet = (n["generated_code"][:160] + "...") if len(n["generated_code"]) > 160 else n["generated_code"]
            else:
                snippet = "Matched by note metadata."

            results.append({
                "id": nid,
                "title": n["title"],
                "snippet": snippet,
                "note_type": n["note_type"],
                "category_name": n["category_name"],
                "category_color": n["category_color"],
                "language": n["language"],
                "score": round(final_score, 2),
                "match_type": match_type,
                "updated_at": n["updated_at"]
            })

        # Sort by final score descending
        results.sort(key=lambda x: x["score"], reverse=True)
        return results[:limit]
