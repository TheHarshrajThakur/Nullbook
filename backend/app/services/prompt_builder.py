import re
from typing import Dict, List, Tuple, Optional, Any

LANGUAGE_CONFIGS = {
    "python": {
        "name": "Python",
        "file_ext": "py",
        "doc_style": "#",
        "paradigm": "Clean, idiomatic Python 3 with type hints and error handling.",
        "sample_import": "from typing import List, Dict, Optional",
    },
    "javascript": {
        "name": "JavaScript",
        "file_ext": "js",
        "doc_style": "//",
        "paradigm": "Modern ES6+ JavaScript, well-commented functions and modular structure.",
        "sample_import": "// Standard ES6 modules",
    },
    "java": {
        "name": "Java",
        "file_ext": "java",
        "doc_style": "//",
        "paradigm": "Standard Object-Oriented Java with a public class, main method or reusable methods.",
        "sample_import": "import java.util.*;",
    },
    "c": {
        "name": "C",
        "file_ext": "c",
        "doc_style": "//",
        "paradigm": "C99 standard, explicit memory safety, proper pointers, and standard library headers.",
        "sample_import": "#include <stdio.h>\n#include <stdlib.h>",
    },
    "cpp": {
        "name": "C++",
        "file_ext": "cpp",
        "doc_style": "//",
        "paradigm": "Modern C++ (C++17/20), STL containers, clean memory management, namespace std.",
        "sample_import": "#include <iostream>\n#include <vector>\n#include <algorithm>",
    },
}

LANGUAGE_MENTIONS = {
    "cpp": [r"\bc\+\+(?!\+)", "cpp", "cplusplus"],
    "python": ["python", "py", "pytest", "django", "flask", "fastapi", "numpy", "pandas"],
    "javascript": ["javascript", "js", "node", "nodejs", "react", "vue", "express", "typescript", "ts"],
    "java": ["java", "jvm", "spring", "springboot"],
    "c": ["c program", "c language", "in c language", "using c language"],
}

# Algorithmic problems and CS concepts that unambiguously denote programming tasks
KNOWN_ALGORITHMS_AND_CONCEPTS = {
    "binary search", "linear search", "bubble sort", "insertion sort", "selection sort",
    "merge sort", "mergesort", "quick sort", "quicksort", "heap sort", "heapsort",
    "radix sort", "counting sort", "topological sort", "dijkstra", "bellman ford",
    "floyd warshall", "kruskal", "prim's algorithm", "bfs", "dfs", "breadth first search",
    "depth first search", "fibonacci", "factorial", "prime number", "sieve of eratosthenes",
    "palindrome", "anagram", "reverse string", "reverse linked list", "two sum", "three sum",
    "matrix multiplication", "knapsack", "longest common subsequence", "lcs",
    "levenshtein distance", "tower of hanoi", "n-queens", "sudoku solver",
    "dynamic programming", "memoization", "backtracking", "linked list", "binary tree",
    "binary search tree", "bst", "avl tree", "trie", "hash table", "hashmap"
}

# Programming action verbs
PROGRAMMING_VERBS = {
    "write", "implement", "create", "build", "develop", "code", "generate",
    "solve", "design", "calculate", "compute", "parse", "debug", "refactor",
    "optimize", "simulate"
}

# Technical objects in software engineering
PROGRAMMING_NOUNS = {
    "function", "algorithm", "method", "class", "program", "script", "api",
    "endpoint", "query", "database", "schema", "table", "crud", "recursion",
    "loop", "array", "matrix", "vector", "linked list", "stack", "queue",
    "tree", "graph", "hashmap", "dictionary", "regex", "decorator",
    "generator", "iterator", "route", "controller", "model"
}

# Code tokens that suggest source code is directly present
EXPLICIT_CODE_TOKENS = [
    r'\bdef\s+[a-zA-Z_]\w*\s*\(',
    r'\bclass\s+[a-zA-Z_]\w*',
    r'\bimport\s+[a-zA-Z_]',
    r'\bfrom\s+[a-zA-Z_]\w*\s+import',
    r'#include\s+<',
    r'\bpublic\s+(?:static\s+)?(?:void|class|int|String)\b',
    r'\bconst\s+[a-zA-Z_]\w*\s*=',
    r'\blet\s+[a-zA-Z_]\w*\s*=',
    r'\bfunction\s+[a-zA-Z_]\w*\s*\(',
    r'\bconsole\.log\(',
    r'\bSystem\.out\.println\(',
    r'\bprintf\s*\(',
    r'```'
]

# Greetings and conversational phrases
GREETINGS_PATTERN = r'^(?:hello|hi|hey|good\s+(?:morning|afternoon|evening)|how\s+are\s+you|who\s+are\s+you|what\s+is\s+your\s+name|test|testing)\b'

# Academic titles, administrative, or meeting indicators
ADMIN_TITLES_PATTERN = r'^(?:dr\.|prof\.|mr\.|mrs\.|ms\.|shri|hod|director|dean|chancellor|principal)\b'

class PromptBuilder:
    @staticmethod
    def validate_coding_intent(text: str) -> Tuple[bool, str, Optional[str]]:
        """
        Validate whether the given text represents an actionable programming requirement.
        Returns: (is_valid, rejection_reason, detected_language)
        """
        clean = text.strip()
        if not clean:
            return False, "Input is empty.", None

        lower = clean.lower()

        # Step 1: Detect explicit programming language
        detected_lang = None
        for lang_key, keywords in LANGUAGE_MENTIONS.items():
            for kw in keywords:
                pattern = kw if kw.startswith('\\b') else r'\b' + re.escape(kw) + r'\b'
                if re.search(pattern, lower):
                    detected_lang = lang_key
                    break
            if detected_lang:
                break
        if not detected_lang and re.search(r'\bin c\b(?!\+)', lower):
            detected_lang = "c"

        # Step 2: Check for explicit source code syntax (pasted code)
        for token_pat in EXPLICIT_CODE_TOKENS:
            if re.search(token_pat, clean):
                return True, "", detected_lang or "python"

        # Step 3: Check for known algorithms or CS concepts
        for algo in KNOWN_ALGORITHMS_AND_CONCEPTS:
            if re.search(r'\b' + re.escape(algo) + r'\b', lower):
                return True, "", detected_lang or "python"

        # Step 4: Reject pure greetings
        if re.search(GREETINGS_PATTERN, lower):
            return False, f"Input '{clean}' is a greeting or conversational phrase rather than a programming task.", None

        # Step 5: Reject person titles / names / administrative phrases
        if re.search(ADMIN_TITLES_PATTERN, lower):
            return False, f"Input appears to be a name or academic title ('{clean}') rather than a programming instruction.", None

        words = re.findall(r'\b[a-zA-Z0-9_\-\+]+\b', clean)
        # If input is very brief (1 to 2 words, e.g., 'Rahul', 'Rahul Sharma', 'Meeting Notes', 'Antigravity')
        if len(words) <= 2:
            return False, f"Input '{clean}' appears to be a name or single term without programming context.", None

        # Step 6: Check for meeting, agenda, syllabus, or personal note indicators
        admin_indicators = [
            "meeting with", "meeting at", "staff council", "attendance", "syllabus",
            "exam schedule", "fee payment", "circular", "notice board", "holiday list",
            "reminder to", "buy milk", "grocery list", "todo list", "diary", "daily journal",
            "essay on", "thoughts about", "presentation for hod", "presentation for director"
        ]
        for ind in admin_indicators:
            if ind in lower:
                return False, f"Input was recognized as an administrative/general note ('{clean[:60]}...') rather than a programming instruction.", None

        # Step 7: Check for co-occurrence of a programming verb AND a programming noun/target
        has_verb = any(re.search(r'\b' + re.escape(v) + r'\b', lower) for v in PROGRAMMING_VERBS)
        has_noun = any(re.search(r'\b' + re.escape(n) + r'\b', lower) for n in PROGRAMMING_NOUNS)

        # Check explicit phrase patterns like 'write a program', 'calculate the ... of', 'function to ...'
        if has_verb and (has_noun or detected_lang):
            return True, "", detected_lang or "python"

        if has_noun and (detected_lang or "code" in lower or "program" in lower):
            return True, "", detected_lang or "python"

        # Check for problem-solving verbs with objects: 'sort a list', 'find duplicate', 'calculate factorial'
        problem_patterns = [
            r'\b(?:sort|filter|search|find|check|calculate|reverse|convert|parse|count)\b.*\b(?:numbers?|elements?|strings?|integers?|duplicates?|prime|factorial|palindrome|vowels?|words?|items?)\b',
            r'\b(?:create|build|make)\b.*\b(?:app|api|website|database|script|cli|calculator|bot)\b'
        ]
        for pat in problem_patterns:
            if re.search(pat, lower):
                return True, "", detected_lang or "python"

        return False, f"Input does not contain an actionable programming requirement or algorithm specification.", None

    @staticmethod
    def detect_intent(text: str) -> Dict[str, Any]:
        """Analyse text to determine if it is a coding request or ordinary writing."""
        clean_text = text.strip()
        if not clean_text:
            return {
                "is_coding_request": False,
                "detected_language": None,
                "confidence": 0.0,
                "extracted_task": None,
                "extracted_requirements": []
            }

        is_coding, reason, detected_lang = PromptBuilder.validate_coding_intent(clean_text)

        # Extract sentences for structured requirements
        sentences = [s.strip() for s in re.split(r'[.!?\n]+', clean_text) if s.strip()]
        task = sentences[0] if sentences else clean_text
        requirements = sentences[1:] if len(sentences) > 1 else []

        confidence = 0.95 if is_coding else 0.0

        return {
            "is_coding_request": is_coding,
            "detected_language": detected_lang,
            "confidence": confidence,
            "extracted_task": task,
            "extracted_requirements": requirements
        }

    @staticmethod
    def construct_prompt(instruction: str, target_language: str) -> str:
        """Construct a high-precision, language-constrained prompt for the local model."""
        lang_info = LANGUAGE_CONFIGS.get(target_language.lower(), LANGUAGE_CONFIGS["python"])
        lang_name = lang_info["name"]

        system_prompt = (
            f"You are an expert software engineer and offline coding assistant.\n"
            f"STRICT REQUIREMENT: The user has selected {lang_name} as the target language.\n"
            f"You MUST generate WORKING, SYNTACTICALLY CORRECT {lang_name} code that directly implements the user's instruction.\n"
            f"Programming Paradigm: {lang_info['paradigm']}\n\n"
            f"RESPONSE FORMAT REQUIREMENTS:\n"
            f"1. Provide the complete, functional code enclosed in markdown triple backticks with '{lang_info['file_ext']}' tag.\n"
            f"2. Follow immediately with a section titled '### Explanation' detailing the algorithm logic, time complexity, and edge cases.\n"
            f"3. Do not include conversational greeting or filler.\n\n"
            f"USER INSTRUCTION:\n{instruction.strip()}\n\n"
            f"NOW GENERATE {lang_name.upper()} CODE:"
        )
        return system_prompt

    @staticmethod
    def parse_response(model_output: str, fallback_language: str = "python") -> Tuple[str, str]:
        """Extract generated code and concise explanation from the model output."""
        text = model_output.strip()
        code = ""
        explanation = ""

        # Extract markdown fenced code blocks
        code_block_pattern = r"```(?:[a-zA-Z0-9_\-\+]*)\n(.*?)```"
        matches = re.findall(code_block_pattern, text, re.DOTALL)

        if matches:
            code = max(matches, key=len).strip()
            parts = re.split(code_block_pattern, text, flags=re.DOTALL)
            remaining_text = " ".join([p for p in parts if p.strip() and p.strip() != code])
            explanation = remaining_text.strip()
        else:
            lines = text.split("\n")
            code_lines = []
            exp_lines = []
            is_code = True
            for line in lines:
                if line.lower().startswith("### explanation") or line.lower().startswith("explanation:"):
                    is_code = False
                if is_code:
                    code_lines.append(line)
                else:
                    exp_lines.append(line)
            code = "\n".join(code_lines).strip()
            explanation = "\n".join(exp_lines).strip()

        if not explanation:
            explanation = f"Generated {fallback_language.capitalize()} code based on the provided requirements."

        return code, explanation
