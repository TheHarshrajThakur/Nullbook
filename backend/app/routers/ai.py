import uuid
from fastapi import APIRouter, Depends, HTTPException
from app.database import get_db, now_iso, sync_fts
from app.schemas import (
    CodeGenRequest, CodeGenResponse, IntentDetectRequest, IntentDetectResponse
)
from app.services.ollama_service import ollama_service
from app.services.prompt_builder import PromptBuilder
from app.services.code_validator import CodeValidator

router = APIRouter(prefix="/api/ai", tags=["AI"])

@router.get("/health")
def ai_health():
    """Check local Ollama daemon reachability and available models."""
    return ollama_service.check_health()

@router.post("/intent", response_model=IntentDetectResponse)
def detect_intent(payload: IntentDetectRequest):
    """Detect whether natural language text is a programming instruction or a normal note."""
    analysis = PromptBuilder.detect_intent(payload.text)
    return IntentDetectResponse(**analysis)

@router.post("/generate", response_model=CodeGenResponse)
def generate_code(payload: CodeGenRequest, db = Depends(get_db)):
    """Generate code in the selected language using the local model and preserve revision history."""
    instruction = payload.instruction.strip()
    if not instruction:
        raise HTTPException(status_code=400, detail="Instruction cannot be empty")

    target_lang = payload.language.lower()

    # Guardrail: Validate that instruction represents a genuine programming request
    is_valid, rejection_reason, detected_lang = PromptBuilder.validate_coding_intent(instruction)
    if not is_valid:
        fallback_notice = (
            f"# ============================================================\n"
            f"# IntelliNote AI: No Actionable Programming Task Detected\n"
            f"# ============================================================\n"
            f"# Input provided: \"{instruction[:80]}\"\n"
            f"#\n"
            f"# Notice: {rejection_reason}\n"
            f"#\n"
            f"# IntelliNote AI generates verified code from programming\n"
            f"# requirements, algorithms, and technical specifications.\n"
            f"#\n"
            f"# Supported example tasks:\n"
            f"#   • 'Write a Python program to sort a list of numbers'\n"
            f"#   • 'Implement a Binary Search algorithm in C++'\n"
            f"#   • 'Create a REST API endpoint for user registration'\n"
            f"#   • 'Calculate the Fibonacci sequence up to N terms'\n"
            f"# ============================================================"
        )
        return CodeGenResponse(
            generated_code=fallback_notice,
            explanation=(
                f"{rejection_reason} Please provide an algorithmic task, function "
                f"specification, or programming problem to generate code."
            ),
            language=target_lang,
            revision_id=None,
            revision_number=None,
            validation_status="not_validated",
            model_used="guardrail_filter"
        )

    # Use detected language if explicitly requested in text, otherwise use payload language
    if detected_lang:
        target_lang = detected_lang

    # Step 1: Build structured language prompt
    prompt = PromptBuilder.construct_prompt(instruction, target_lang)

    # Step 2: Query local Ollama model
    health = ollama_service.check_health()
    if not health.get("daemon_running"):
        raise HTTPException(
            status_code=503,
            detail="Offline coding model daemon is not running. Please start Ollama locally on port 11434."
        )

    try:
        raw_output = ollama_service.generate(prompt)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Local model generation failed: {str(e)}")

    # Step 3: Parse response into code & explanation
    code, explanation = PromptBuilder.parse_response(raw_output, fallback_language=target_lang)

    # Step 4: Validate syntax automatically
    val_res = CodeValidator.validate_syntax(code, target_lang)
    validation_status = val_res.get("status", "not_validated")

    revision_id = None
    revision_number = None

    # Step 5: If attached to a note, preserve revision history
    if payload.note_id:
        cur = db.cursor()
        cur.execute("SELECT id, content FROM notes WHERE id = ? AND is_deleted = 0", (payload.note_id,))
        note_row = cur.fetchone()
        if note_row:
            # Count existing revisions
            cur.execute("SELECT COALESCE(MAX(revision_number), 0) as max_rev FROM revisions WHERE note_id = ?", (payload.note_id,))
            max_rev = cur.fetchone()["max_rev"]
            revision_number = max_rev + 1
            revision_id = str(uuid.uuid4())

            # Store in revisions table
            cur.execute("""
                INSERT INTO revisions (
                    id, note_id, revision_number, instruction, generated_code,
                    language, explanation, validation_status, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                revision_id,
                payload.note_id,
                revision_number,
                instruction,
                code,
                target_lang,
                explanation,
                validation_status,
                now_iso()
            ))

            # Update the note with the generated code while preserving user's content
            cur.execute("""
                UPDATE notes
                SET generated_code = ?, language = ?, explanation = ?, validation_status = ?, updated_at = ?
                WHERE id = ?
            """, (
                code,
                target_lang,
                explanation,
                validation_status,
                now_iso(),
                payload.note_id
            ))
            db.commit()

            # Keep FTS5 in sync
            sync_fts(db, payload.note_id)

    return CodeGenResponse(
        generated_code=code,
        explanation=explanation,
        language=target_lang,
        revision_id=revision_id,
        revision_number=revision_number,
        validation_status=validation_status,
        model_used=ollama_service.default_model
    )
