export type NoteType = 'write' | 'code' | 'auto';

export interface Note {
  id: string;
  title: string;
  content: string;
  note_type: NoteType;
  category_id: string | null;
  category_name?: string;
  category_color?: string;
  tags: string[];
  language: string;
  generated_code: string;
  explanation: string;
  validation_status: string;
  is_favorite: boolean;
  is_pinned: boolean;
  revisions_count: number;
  created_at: string;
  updated_at: string;
}

export interface Revision {
  id: string;
  note_id: string;
  revision_number: number;
  instruction: string;
  generated_code: string;
  language: string;
  explanation: string;
  validation_status: string;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  is_system: boolean;
  notes_count: number;
  created_at: string;
}

export interface SearchResultItem {
  id: string;
  title: string;
  snippet: string;
  note_type: string;
  category_name: string;
  category_color: string;
  language: string;
  score: number;
  match_type: string;
  updated_at: string;
}

export interface SystemStatus {
  app_version: string;
  database_ok: boolean;
  notes_count: number;
  ollama_status: 'ready' | 'not_installed' | 'loading' | 'unavailable';
  ollama_models: string[];
  active_coding_model: string;
  active_embedding_model: string;
  whisper_status: 'ready' | 'not_installed' | 'fallback';
  offline_mode: boolean;
}

export interface ValidationResult {
  status: 'not_validated' | 'syntax_check_passed' | 'syntax_check_failed' | 'validation_unavailable';
  message: string;
  error_line?: number | null;
  error_column?: number | null;
  details?: string | null;
}

export interface ExecutionResult {
  stdout: string;
  stderr: string;
  exit_code: number;
  execution_time_ms: number;
  timed_out: boolean;
  memory_exceeded: boolean;
}

export interface VoiceCommandResponse {
  action: string;
  parameters: Record<string, any>;
  requires_confirmation: boolean;
  confirmation_message?: string | null;
  executed: boolean;
  message: string;
}

export type SaveStatus = 'saved' | 'saving' | 'unsaved' | 'error';
export type Theme = 'dark' | 'light';
