import pytest
import os
import sys
from pathlib import Path

# Ensure backend root is on sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.config import settings
# Use a dedicated test database
TEST_DB = str(Path(__file__).resolve().parent / "test_intellinote.db")
settings.DB_PATH = TEST_DB

from app.database import init_db, get_db_connection, sync_fts
from app.services.prompt_builder import PromptBuilder
from app.services.code_validator import CodeValidator
from app.services.categorization_service import CategorizationService
from app.services.search_service import SearchService
from app.services.execution_sandbox import ExecutionSandbox
from app.services.voice_service import VoiceService
from fastapi.testclient import TestClient
from app.main import app

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    if os.path.exists(TEST_DB):
        try: os.remove(TEST_DB)
        except Exception: pass
    init_db()
    yield
    if os.path.exists(TEST_DB):
        try: os.remove(TEST_DB)
        except Exception: pass

@pytest.fixture
def client():
    return TestClient(app)

# 1. Notes CRUD & Revisions Tests
def test_notes_crud_and_revisions(client):
    # Create note
    payload = {
        "title": "Reverse String in Python",
        "content": "Write a python function to reverse a string",
        "note_type": "code",
        "language": "python"
    }
    res = client.post("/api/notes", json=payload)
    assert res.status_code == 200
    note = res.json()
    note_id = note["id"]
    assert note["title"] == "Reverse String in Python"
    assert note["language"] == "python"

    # Update note instruction without losing generated code
    upd = client.put(f"/api/notes/{note_id}", json={"content": "Updated requirement: reverse string and ignore punctuation"})
    assert upd.status_code == 200
    assert upd.json()["content"] == "Updated requirement: reverse string and ignore punctuation"

    # Add mock revisions to test revision history preservation and restoration
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO revisions (id, note_id, revision_number, instruction, generated_code, language, explanation, validation_status, created_at)
        VALUES ('rev-1', ?, 1, 'first instruction', 'def rev1(s): return s[::-1]', 'python', 'slicing', 'syntax_check_passed', '2026-10-13T00:00:00')
    """, (note_id,))
    cur.execute("""
        INSERT INTO revisions (id, note_id, revision_number, instruction, generated_code, language, explanation, validation_status, created_at)
        VALUES ('rev-2', ?, 2, 'second instruction', 'def rev2(s): return \"\".join(reversed(s))', 'python', 'reversed iter', 'syntax_check_passed', '2026-10-13T00:01:00')
    """, (note_id,))
    conn.commit()
    conn.close()

    # List revisions
    revs_res = client.get(f"/api/notes/{note_id}/revisions")
    assert revs_res.status_code == 200
    revs = revs_res.json()
    assert len(revs) >= 2
    assert revs[0]["revision_number"] == 2
    assert revs[1]["revision_number"] == 1

    # Restore revision 1
    restore_res = client.post(f"/api/notes/{note_id}/revisions/rev-1/restore")
    assert restore_res.status_code == 200
    assert restore_res.json()["generated_code"] == "def rev1(s): return s[::-1]"

# 2. Intent Detection & Guardrails Tests
def test_intent_detection():
    # Ordinary note & names
    ord_text = "Tomorrow I need to revise database normalisation and attend lecture."
    ord_res = PromptBuilder.detect_intent(ord_text)
    assert ord_res["is_coding_request"] is False

    # Name rejection
    name_res = PromptBuilder.detect_intent("Rahul")
    assert name_res["is_coding_request"] is False

    full_name_res = PromptBuilder.detect_intent("Rahul Sharma")
    assert full_name_res["is_coding_request"] is False

    admin_res = PromptBuilder.detect_intent("Meeting with Director at 3pm tomorrow regarding project syllabus")
    assert admin_res["is_coding_request"] is False

    # Coding instruction
    code_text = "Write a Python program that accepts a list of numbers, removes duplicate values and prints them."
    code_res = PromptBuilder.detect_intent(code_text)
    assert code_res["is_coding_request"] is True
    assert code_res["detected_language"] == "python"

    # Java request
    java_text = "Create a Java function to reverse a string."
    java_res = PromptBuilder.detect_intent(java_text)
    assert java_res["is_coding_request"] is True
    assert java_res["detected_language"] == "java"

    # Algorithm alone
    algo_res = PromptBuilder.detect_intent("quicksort algorithm")
    assert algo_res["is_coding_request"] is True

def test_generate_code_guardrail(client):
    # Testing that person name does not invoke LLM and returns structured notice
    res = client.post("/api/ai/generate", json={
        "instruction": "Rahul",
        "language": "python"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["model_used"] == "guardrail_filter"
    assert "No Actionable Programming Task Detected" in data["generated_code"]
    assert data["validation_status"] == "not_validated"

# 3. Categorization & Learning Tests
def test_categorization_and_learning(client):
    # DSA note
    dsa_res = CategorizationService.suggest_category(
        "Binary Search Analysis",
        "Implement binary search in Python and analyse its time complexity and space complexity."
    )
    assert dsa_res["suggested_category_name"] == "Data Structures and Algorithms"
    assert "DSA" in dsa_res["suggested_tags"] or "Algorithms" in dsa_res["suggested_tags"]

    # Interview note
    career_res = CategorizationService.suggest_category(
        "React Interview Prep",
        "Prepare interview questions about React hooks and state management."
    )
    assert career_res["suggested_category_name"] in ("Career Preparation", "Programming")

    # Feedback learning: record user override
    client.post("/api/categories/feedback", json={
        "note_title": "Custom Unique Hardware Note",
        "note_content": "FPGA programming with Verilog",
        "predicted_category": "Programming",
        "corrected_category": "Academics"
    })
    # Subsequent suggestion for same title should prioritize learned category
    learned_sug = CategorizationService.suggest_category("Custom Unique Hardware Note", "FPGA programming with Verilog")
    assert learned_sug["suggested_category_name"] == "Academics"
    assert learned_sug["confidence"] >= 0.90

# 4. Search Tests (FTS5 + Filtered)
def test_fts5_and_filtered_search(client):
    # Insert searchable note
    res = client.post("/api/notes", json={
        "title": "QuickSort Inplace Implementation",
        "content": "Partition logic and pivot selection in python for quicksort",
        "generated_code": "def quicksort(arr): pass",
        "language": "python",
        "tags": ["Sorting", "Algorithms"]
    })
    assert res.status_code == 200

    # Search keyword
    s_res = client.get("/api/search?q=quicksort")
    assert s_res.status_code == 200
    data = s_res.json()
    assert data["total"] >= 1
    assert any("quicksort" in item["title"].lower() for item in data["items"])

# 5. Code Validator Tests
def test_code_validation():
    # Valid Python
    valid_py = "def add(a: int, b: int) -> int:\n    return a + b\n"
    v_res = CodeValidator.validate_syntax(valid_py, "python")
    assert v_res["status"] == "syntax_check_passed"

    # Invalid Python
    invalid_py = "def add(a, b\n    return a + b"
    inv_res = CodeValidator.validate_syntax(invalid_py, "python")
    assert inv_res["status"] == "syntax_check_failed"
    assert inv_res["error_line"] is not None

    # Unsupported language
    unsupported_res = CodeValidator.validate_syntax("print 'hi'", "cobol")
    assert unsupported_res["status"] == "validation_unavailable"

# 6. Sandboxed Execution Tests
def test_execution_sandbox():
    safe_code = "a = 10\nb = 20\nprint(f'Sum: {a + b}')\n"
    res = ExecutionSandbox.run_code_safely(safe_code, "python")
    assert res["exit_code"] == 0
    assert "Sum: 30" in res["stdout"]
    assert res["timed_out"] is False

    # Timeout test
    loop_code = "import time\ntime.sleep(10)\n"
    res_timeout = ExecutionSandbox.run_code_safely(loop_code, "python")
    assert res_timeout["timed_out"] is True
    assert "timed out" in res_timeout["stderr"]

# 7. Voice Command Allowlist Tests
def test_voice_command_parsing():
    # New note
    cmd1 = VoiceService.parse_command("Create a new note")
    assert cmd1["action"] == "create_note"

    # Search
    cmd2 = VoiceService.parse_command("Search for my Python sorting code")
    assert cmd2["action"] == "search"
    assert "python sorting" in cmd2["parameters"]["query"].lower()

    # Generate
    cmd3 = VoiceService.parse_command("Generate JavaScript code from this instruction")
    assert cmd3["action"] == "generate_code"
    assert cmd3["parameters"]["language"] == "javascript"

    # Switch language
    cmd4 = VoiceService.parse_command("Switch the programming language to C++")
    assert cmd4["action"] == "switch_language"
    assert cmd4["parameters"]["language"] == "cpp"

    # Delete note (requires confirmation)
    cmd5 = VoiceService.parse_command("Delete this note")
    assert cmd5["action"] == "delete_note"
    assert cmd5["requires_confirmation"] is True
    assert cmd5["confirmation_message"] is not None

    # Dictation fallback
    dictation = VoiceService.parse_command("Today was a productive study session.")
    assert dictation["action"] == "dictation"
    assert "productive study session" in dictation["parameters"]["text"]
