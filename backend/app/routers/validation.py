from fastapi import APIRouter
from app.schemas import (
    ValidateCodeRequest, ValidateCodeResponse,
    ExecuteCodeRequest, ExecuteCodeResponse
)
from app.services.code_validator import CodeValidator
from app.services.execution_sandbox import ExecutionSandbox

router = APIRouter(prefix="/api/validation", tags=["Validation & Sandbox"])

@router.post("/validate", response_model=ValidateCodeResponse)
def validate_code_syntax(payload: ValidateCodeRequest):
    """Run local syntax validation against code."""
    res = CodeValidator.validate_syntax(payload.code, payload.language)
    return ValidateCodeResponse(**res)

@router.post("/execute", response_model=ExecuteCodeResponse)
def execute_code_sandboxed(payload: ExecuteCodeRequest):
    """Explicitly execute user-reviewed code in a restricted, sandboxed temporary environment."""
    res = ExecutionSandbox.run_code_safely(payload.code, payload.language, payload.stdin_data)
    return ExecuteCodeResponse(**res)
