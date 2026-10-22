import requests
import json

BASE = "http://127.0.0.1:8765/api"

def main():
    print("--- 1. Testing System Status ---")
    res = requests.get(f"{BASE}/system/status")
    print("System status:", res.status_code, res.json())

    print("\n--- 2. Testing Categories Listing ---")
    res = requests.get(f"{BASE}/categories")
    categories = res.json()
    print(f"Categories count: {len(categories)}")
    for c in categories[:3]:
        print(f"  - {c['name']} (Color: {c['color']}, System: {c['is_system']})")

    print("\n--- 3. Testing Note Creation & Automatic Categorization ---")
    note_payload = {
        "title": "Binary Search Algorithm",
        "content": "Implement binary search in Python and analyse its time complexity and space complexity.",
        "note_type": "code",
        "language": "python"
    }
    res = requests.post(f"{BASE}/notes", json=note_payload)
    note = res.json()
    note_id = note["id"]
    print("Created Note ID:", note_id)
    print("Title:", note["title"])
    print("Auto-Assigned Category:", note["category_name"])
    print("Auto-Assigned Tags:", note["tags"])
    assert note["category_name"] == "Data Structures and Algorithms", f"Expected DSA, got {note['category_name']}"

    print("\n--- 4. Testing Intent Detection ---")
    intent_res = requests.post(f"{BASE}/ai/intent", json={
        "text": "Write a python function to find the maximum element in a binary tree."
    }).json()
    print("Intent result:", intent_res)
    assert intent_res["is_coding_request"] is True
    assert intent_res["detected_language"] == "python"

    print("\n--- 5. Testing Code Validation ---")
    val_res = requests.post(f"{BASE}/validation/validate", json={
        "code": "def binary_search(arr, target):\n    left, right = 0, len(arr) - 1\n    return -1\n",
        "language": "python"
    }).json()
    print("Validation result:", val_res)
    assert val_res["status"] == "syntax_check_passed"

    print("\n--- 6. Testing Sandboxed Execution ---")
    exec_res = requests.post(f"{BASE}/validation/execute", json={
        "code": "nums = [1, 2, 3, 4, 5]\nprint('Binary search target found at index:', nums.index(3))\n",
        "language": "python"
    }).json()
    print("Sandbox result:", exec_res)
    assert exec_res["exit_code"] == 0
    assert "target found at index: 2" in exec_res["stdout"]

    print("\n--- 7. Testing FTS5 Keyword and Filtered Search ---")
    search_res = requests.post(f"{BASE}/search", json={
        "query": "binary search",
        "search_type": "keyword"
    }).json()
    print(f"Search results for 'binary search': Total {search_res['total']}")
    for item in search_res["items"]:
        print(f"  Match: {item['title']} (Score: {item['score']}, Type: {item['match_type']})")
        print(f"  Snippet: {item['snippet']}")
    assert search_res["total"] >= 1

    print("\n--- 8. Testing Voice Command Parsing ---")
    voice_res = requests.post(f"{BASE}/voice/command", json={
        "transcript": "Switch the programming language to C++"
    }).json()
    print("Voice command result:", voice_res)
    assert voice_res["action"] == "switch_language"
    assert voice_res["parameters"]["language"] == "cpp"

    print("\n--- 9. Testing Revision History Preservation ---")
    # Simulate adding revisions to test revision history
    from app.database import get_db_connection
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO revisions (id, note_id, revision_number, instruction, generated_code, language, explanation, validation_status, created_at)
        VALUES ('rev-live-1', ?, 1, 'v1 instruction', 'def bs_v1(): pass', 'python', 'initial', 'syntax_check_passed', '2026-10-13T05:00:00')
    """, (note_id,))
    conn.commit()
    conn.close()

    revs = requests.get(f"{BASE}/notes/{note_id}/revisions").json()
    print(f"Revisions for note {note_id}: {len(revs)}")
    assert len(revs) == 1
    assert revs[0]["generated_code"] == "def bs_v1(): pass"

    # Restore revision
    restored = requests.post(f"{BASE}/notes/{note_id}/revisions/rev-live-1/restore").json()
    print("Restored note generated code:", restored["generated_code"])
    assert restored["generated_code"] == "def bs_v1(): pass"

    print("\n>>> ALL 9 END-TO-END LIVE BACKEND VERIFICATION CHECKS PASSED SUCCESSFULLY! <<<")

if __name__ == "__main__":
    main()
