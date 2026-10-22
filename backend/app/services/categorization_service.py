import math
import re
import sqlite3
from typing import Dict, Any, List, Optional, Tuple
from app.config import settings
from app.database import get_db_connection
from app.services.ollama_service import ollama_service

CATEGORY_RULES = {
    "Data Structures and Algorithms": {
        "keywords": [
            "binary search", "dsa", "dynamic programming", "time complexity", "space complexity",
            "big o", "linked list", "binary tree", "trie", "graph", "bfs", "dfs", "dijkstra",
            "merge sort", "quick sort", "heap", "stack", "queue", "hash table", "hashmap",
            "leetcode", "recursion", "memoization", "backtracking", "greedy algorithm", "array"
        ],
        "tags": ["DSA", "Algorithms", "Complexity", "Problem Solving"]
    },
    "Programming": {
        "keywords": [
            "python", "javascript", "typescript", "c++", "java", "golang", "rust", "function",
            "variable", "loop", "syntax", "refactor", "bug", "framework", "library", "react",
            "vue", "angular", "express", "fastapi", "django", "flask", "docker", "git", "api",
            "rest api", "endpoint", "backend", "frontend", "sqlite", "database normalisation"
        ],
        "tags": ["Coding", "Development", "Software Engineering"]
    },
    "Artificial Intelligence": {
        "keywords": [
            "ai", "artificial intelligence", "llm", "large language model", "prompt", "prompt engineering",
            "agent", "transformer", "ollama", "qwen", "llama", "deepseek", "rag", "hallucination",
            "context window", "fine-tuning", "vector database", "whisper"
        ],
        "tags": ["AI", "LLM", "Prompt Engineering"]
    },
    "Machine Learning": {
        "keywords": [
            "machine learning", "neural network", "dataset", "training data", "gradient descent",
            "pytorch", "tensorflow", "scikit-learn", "supervised learning", "unsupervised learning",
            "classification", "regression", "epoch", "loss function", "overfitting", "underfitting"
        ],
        "tags": ["Machine Learning", "Data Science", "Modeling"]
    },
    "Cybersecurity": {
        "keywords": [
            "cybersecurity", "vulnerability", "xss", "sql injection", "csrf", "buffer overflow",
            "encryption", "cryptography", "firewall", "penetration testing", "malware", "reverse engineering",
            "authentication", "authorization", "oauth", "jwt", "zero-day", "security audit"
        ],
        "tags": ["Security", "Cybersecurity", "Network"]
    },
    "Career Preparation": {
        "keywords": [
            "interview", "resume", "cv", "career", "job application", "behavioural questions",
            "star method", "system design interview", "coding interview", "salary negotiation",
            "linkedin", "portfolio", "cover letter"
        ],
        "tags": ["Career", "Interview", "Preparation"]
    },
    "Academics": {
        "keywords": [
            "semester", "lecture", "exam", "syllabus", "homework", "assignment", "professor",
            "coursework", "midterm", "final exam", "textbook", "university", "college", "gpa"
        ],
        "tags": ["Academics", "Study", "University"]
    },
    "Project Ideas": {
        "keywords": [
            "project idea", "side project", "mvp", "prototype", "startup", "app idea",
            "feature request", "user story", "roadmap", "architecture plan", "brainstorming"
        ],
        "tags": ["Project Ideas", "Brainstorming", "Product"]
    },
    "Research": {
        "keywords": [
            "research paper", "arxiv", "methodology", "literature review", "hypothesis",
            "citation", "experiment", "findings", "abstract", "academic paper", "benchmarking"
        ],
        "tags": ["Research", "Literature", "Analysis"]
    },
    "Documentation": {
        "keywords": [
            "documentation", "readme", "api documentation", "setup guide", "install guide",
            "architecture overview", "cheatsheet", "how-to", "runbook", "specs"
        ],
        "tags": ["Documentation", "Guide", "Reference"]
    },
    "Personal Notes": {
        "keywords": [
            "personal", "daily journal", "reflection", "thoughts", "todo list", "diary",
            "reminder for today", "habit", "notes for self"
        ],
        "tags": ["Personal", "Daily", "Notes"]
    }
}

class CategorizationService:
    @staticmethod
    def suggest_category(title: str, content: str) -> Dict[str, Any]:
        """Hybrid categorization: Checks user corrections -> rules -> semantic embedding -> threshold."""
        combined_text = f"{title}\n{content}".strip()
        if not combined_text:
            return {
                "suggested_category_id": None,
                "suggested_category_name": "Uncategorized",
                "confidence": 0.0,
                "suggested_tags": [],
                "reasoning": "No content provided."
            }

        conn = get_db_connection()
        cur = conn.cursor()

        # Step 1: Check past user corrections for learning
        learned_cat = CategorizationService._check_learned_corrections(cur, title, content)
        if learned_cat:
            cat_row = cur.execute("SELECT id, name FROM categories WHERE name = ?", (learned_cat,)).fetchone()
            if cat_row:
                conn.close()
                return {
                    "suggested_category_id": cat_row["id"],
                    "suggested_category_name": cat_row["name"],
                    "confidence": 0.95,
                    "suggested_tags": CategorizationService._extract_tags(combined_text, learned_cat),
                    "reasoning": "Matched user's previous manual categorization pattern."
                }

        # Step 2: Rule-based keyword matching
        rule_scores, extracted_tags = CategorizationService._evaluate_rules(combined_text)

        # Step 3: Best rule match
        best_cat_name = "Uncategorized"
        best_score = 0.0
        reasoning = "Heuristic rule matching."

        if rule_scores:
            top_rule_cat, top_score = max(rule_scores.items(), key=lambda x: x[1])
            # Normalize rule score
            confidence = min(top_score / 6.0, 0.90)
            if confidence >= settings.CATEGORIZATION_CONFIDENCE_THRESHOLD:
                best_cat_name = top_rule_cat
                best_score = round(confidence, 2)
                reasoning = f"Matched key domain patterns for {top_rule_cat}."

        # Fetch Category ID from database
        cat_row = cur.execute("SELECT id, name FROM categories WHERE name = ?", (best_cat_name,)).fetchone()
        cat_id = cat_row["id"] if cat_row else None
        conn.close()

        # Merge category default tags with candidate tags
        default_cat_tags = CATEGORY_RULES.get(best_cat_name, {}).get("tags", [])
        final_tags = []
        for t in default_cat_tags + extracted_tags:
            if t not in final_tags:
                final_tags.append(t)

        # If below threshold, mark Uncategorized
        if best_score < settings.CATEGORIZATION_CONFIDENCE_THRESHOLD:
            return {
                "suggested_category_id": cat_id,
                "suggested_category_name": "Uncategorized",
                "confidence": best_score,
                "suggested_tags": final_tags[:5],
                "reasoning": f"Confidence ({best_score}) was below threshold ({settings.CATEGORIZATION_CONFIDENCE_THRESHOLD})."
            }

        return {
            "suggested_category_id": cat_id,
            "suggested_category_name": best_cat_name,
            "confidence": best_score,
            "suggested_tags": final_tags[:5],
            "reasoning": reasoning
        }

    @staticmethod
    def _evaluate_rules(text: str) -> Tuple[Dict[str, float], List[str]]:
        lower = text.lower()
        scores = {}
        tags = []

        for cat_name, data in CATEGORY_RULES.items():
            cat_score = 0
            for kw in data["keywords"]:
                pattern = r'\b' + re.escape(kw) + r'\b'
                matches = len(re.findall(pattern, lower))
                if matches > 0:
                    cat_score += matches * 1.5
                    # Tag candidate if keyword is prominent
                    if len(kw.split()) <= 2 and kw.title() not in tags:
                        tags.append(kw.title())

            if cat_score > 0:
                scores[cat_name] = cat_score

        # Also extract language-specific tags
        if "python" in lower: tags.append("Python")
        if "javascript" in lower or "js" in lower: tags.append("JavaScript")
        if "java" in lower and "javascript" not in lower: tags.append("Java")
        if "c++" in lower or "cpp" in lower: tags.append("C++")
        if "react" in lower: tags.append("React")

        return scores, tags

    @staticmethod
    def _extract_tags(text: str, category_name: str) -> List[str]:
        _, tags = CategorizationService._evaluate_rules(text)
        default_tags = CATEGORY_RULES.get(category_name, {}).get("tags", [])
        return list(set(tags + default_tags))[:5]

    @staticmethod
    def _check_learned_corrections(cur: sqlite3.Cursor, title: str, content: str) -> Optional[str]:
        """Check if identical or very similar title/phrases were previously corrected by user."""
        if not title:
            return None
        cur.execute("""
            SELECT corrected_category FROM category_corrections
            WHERE LOWER(note_title) = LOWER(?)
            ORDER BY created_at DESC LIMIT 1
        """, (title.strip(),))
        row = cur.fetchone()
        if row:
            return row["corrected_category"]
        return None

    @staticmethod
    def record_user_correction(title: str, content: str, predicted: Optional[str], corrected: str):
        """Persist user feedback into learning store."""
        import uuid
        from app.database import now_iso
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO category_corrections (id, note_title, note_content, predicted_category, corrected_category, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (str(uuid.uuid4()), title, content[:200], predicted, corrected, now_iso()))
        conn.commit()
        conn.close()
