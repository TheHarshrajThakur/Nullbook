from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field

# Notes
class NoteCreate(BaseModel):
    title: str = "Untitled Note"
    content: str = ""
    note_type: str = "auto"  # 'write', 'code', 'auto'
    category_id: Optional[str] = None
    tags: List[str] = []
    language: str = "python"
    generated_code: Optional[str] = ""
    explanation: Optional[str] = ""

class NoteUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    note_type: Optional[str] = None
    category_id: Optional[str] = None
    tags: Optional[List[str]] = None
    language: Optional[str] = None
    generated_code: Optional[str] = None
    explanation: Optional[str] = None
    validation_status: Optional[str] = None
    is_favorite: Optional[bool] = None
    is_pinned: Optional[bool] = None

class RevisionOut(BaseModel):
    id: str
    note_id: str
    revision_number: int
    instruction: str
    generated_code: str
    language: str
    explanation: str
    validation_status: str
    created_at: str

class NoteOut(BaseModel):
    id: str
    title: str
    content: str
    note_type: str
    category_id: Optional[str]
    category_name: Optional[str] = "Uncategorized"
    category_color: Optional[str] = "#94A3B8"
    tags: List[str] = []
    language: str
    generated_code: str = ""
    explanation: str = ""
    validation_status: str = "not_validated"
    is_favorite: bool = False
    is_pinned: bool = False
    revisions_count: int = 0
    created_at: str
    updated_at: str

# Categories
class CategoryCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    color: Optional[str] = "#3B82F6"
    icon: Optional[str] = "Folder"

class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    color: Optional[str] = None
    icon: Optional[str] = None

class CategoryOut(BaseModel):
    id: str
    name: str
    description: Optional[str]
    color: str
    icon: str
    is_system: bool
    notes_count: int = 0
    created_at: str

# Code Generation & AI
class CodeGenRequest(BaseModel):
    note_id: Optional[str] = None
    instruction: str
    language: str = "python"
    save_revision: bool = True

class CodeGenResponse(BaseModel):
    generated_code: str
    explanation: str
    language: str
    revision_id: Optional[str] = None
    revision_number: Optional[int] = None
    validation_status: str = "not_validated"
    model_used: str

class IntentDetectRequest(BaseModel):
    text: str

class IntentDetectResponse(BaseModel):
    is_coding_request: bool
    detected_language: Optional[str] = None
    confidence: float
    extracted_task: Optional[str] = None
    extracted_requirements: List[str] = []

# Categorization
class CategorySuggestRequest(BaseModel):
    title: str
    content: str

class CategorySuggestResponse(BaseModel):
    suggested_category_id: Optional[str]
    suggested_category_name: str
    confidence: float
    suggested_tags: List[str]
    reasoning: str

class CategoryFeedbackRequest(BaseModel):
    note_title: str
    note_content: str
    predicted_category: Optional[str]
    corrected_category: str

# Search
class SearchQuery(BaseModel):
    query: str
    category_id: Optional[str] = None
    language: Optional[str] = None
    tag: Optional[str] = None
    search_type: str = "all"  # 'all', 'keyword', 'semantic'
    limit: int = 25

class SearchResultItem(BaseModel):
    id: str
    title: str
    snippet: str
    note_type: str
    category_name: str
    category_color: str
    language: str
    score: float
    match_type: str  # 'exact_title', 'fts_keyword', 'semantic_vector', 'hybrid'
    updated_at: str

class SearchResponse(BaseModel):
    items: List[SearchResultItem]
    total: int
    query: str
    search_type: str

# Validation and Execution
class ValidateCodeRequest(BaseModel):
    code: str
    language: str

class ValidateCodeResponse(BaseModel):
    status: str  # 'syntax_check_passed', 'syntax_check_failed', 'validation_unavailable'
    message: str
    error_line: Optional[int] = None
    error_column: Optional[int] = None
    details: Optional[str] = None

class ExecuteCodeRequest(BaseModel):
    code: str
    language: str
    stdin_data: Optional[str] = ""

class ExecuteCodeResponse(BaseModel):
    stdout: str
    stderr: str
    exit_code: int
    execution_time_ms: float
    timed_out: bool = False
    memory_exceeded: bool = False

# Voice
class VoiceCommandRequest(BaseModel):
    transcript: str
    current_note_id: Optional[str] = None

class VoiceCommandResponse(BaseModel):
    action: str  # 'create_note', 'search', 'generate_code', 'switch_language', 'save_note', 'categorize', 'filter_category', 'dictation', 'unknown'
    parameters: Dict[str, Any] = {}
    requires_confirmation: bool = False
    confirmation_message: Optional[str] = None
    executed: bool = False
    message: str

# System / Health
class SystemStatusResponse(BaseModel):
    app_version: str
    database_ok: bool
    notes_count: int
    ollama_status: str  # 'ready', 'not_installed', 'loading', 'unavailable'
    ollama_models: List[str]
    active_coding_model: str
    active_embedding_model: str
    whisper_status: str  # 'ready', 'not_installed', 'fallback'
    offline_mode: bool = True
