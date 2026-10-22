import {
  Note, Revision, Category, SearchResultItem,
  SystemStatus, ValidationResult, ExecutionResult, VoiceCommandResponse
} from '../types';

const API_BASE = 'http://127.0.0.1:8765/api';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errorData.detail || `Request failed with HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  // Notes
  async getNotes(params?: { category_id?: string; favorite_only?: boolean; note_type?: string }): Promise<Note[]> {
    const query = new URLSearchParams();
    if (params?.category_id) query.append('category_id', params.category_id);
    if (params?.favorite_only) query.append('favorite_only', 'true');
    if (params?.note_type && params.note_type !== 'all') query.append('note_type', params.note_type);
    const res = await fetch(`${API_BASE}/notes?${query.toString()}`);
    return handleResponse<Note[]>(res);
  },

  async getNote(id: string): Promise<Note> {
    const res = await fetch(`${API_BASE}/notes/${id}`);
    return handleResponse<Note>(res);
  },

  async createNote(data: {
    title?: string;
    content?: string;
    note_type?: string;
    category_id?: string | null;
    tags?: string[];
    language?: string;
    generated_code?: string;
  }): Promise<Note> {
    const res = await fetch(`${API_BASE}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse<Note>(res);
  },

  async updateNote(id: string, data: Partial<Note>): Promise<Note> {
    const res = await fetch(`${API_BASE}/notes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse<Note>(res);
  },

  async deleteNote(id: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/notes/${id}`, { method: 'DELETE' });
    return handleResponse(res);
  },

  async toggleFavorite(id: string): Promise<Note> {
    const res = await fetch(`${API_BASE}/notes/${id}/toggle-favorite`, { method: 'POST' });
    return handleResponse<Note>(res);
  },

  async getRevisions(noteId: string): Promise<Revision[]> {
    const res = await fetch(`${API_BASE}/notes/${noteId}/revisions`);
    return handleResponse<Revision[]>(res);
  },

  async restoreRevision(noteId: string, revisionId: string): Promise<Note> {
    const res = await fetch(`${API_BASE}/notes/${noteId}/revisions/${revisionId}/restore`, { method: 'POST' });
    return handleResponse<Note>(res);
  },

  getExportUrl(noteId: string, format: string): string {
    return `${API_BASE}/notes/${noteId}/export?export_format=${format}`;
  },

  // Drafts
  async saveDraft(noteId: string, data: { title: string; content: string; generated_code: string; language: string }): Promise<void> {
    await fetch(`${API_BASE}/notes/drafts/${noteId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  async getDraft(noteId: string): Promise<{ draft: any }> {
    const res = await fetch(`${API_BASE}/notes/drafts/${noteId}`);
    return handleResponse(res);
  },

  async clearDraft(noteId: string): Promise<void> {
    await fetch(`${API_BASE}/notes/drafts/${noteId}`, { method: 'DELETE' });
  },

  // Categories
  async getCategories(): Promise<Category[]> {
    const res = await fetch(`${API_BASE}/categories`);
    return handleResponse<Category[]>(res);
  },

  async createCategory(data: { name: string; description?: string; color?: string; icon?: string }): Promise<Category> {
    const res = await fetch(`${API_BASE}/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse<Category>(res);
  },

  async updateCategory(id: string, data: Partial<Category>): Promise<Category> {
    const res = await fetch(`${API_BASE}/categories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse<Category>(res);
  },

  async deleteCategory(id: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/categories/${id}`, { method: 'DELETE' });
    return handleResponse(res);
  },

  async suggestCategory(title: string, content: string): Promise<{
    suggested_category_id: string | null;
    suggested_category_name: string;
    confidence: number;
    suggested_tags: string[];
    reasoning: string;
  }> {
    const res = await fetch(`${API_BASE}/categories/suggest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content })
    });
    return handleResponse(res);
  },

  async sendCategoryFeedback(data: {
    note_title: string;
    note_content: string;
    predicted_category?: string;
    corrected_category: string;
  }): Promise<void> {
    await fetch(`${API_BASE}/categories/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  // Search
  async searchNotes(params: {
    query: string;
    category_id?: string;
    language?: string;
    tag?: string;
    search_type?: string;
    limit?: number;
  }): Promise<{ items: SearchResultItem[]; total: number; query: string }> {
    const res = await fetch(`${API_BASE}/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: params.query,
        category_id: params.category_id,
        language: params.language,
        tag: params.tag,
        search_type: params.search_type || 'all',
        limit: params.limit || 25
      })
    });
    return handleResponse(res);
  },

  // AI & Code Generation
  async getAIHealth(): Promise<{
    status: 'ready' | 'not_installed' | 'loading' | 'unavailable';
    daemon_running: boolean;
    models: string[];
    active_model: string;
    model_ready: boolean;
    message: string;
  }> {
    const res = await fetch(`${API_BASE}/ai/health`);
    return handleResponse(res);
  },

  async detectIntent(text: string): Promise<{
    is_coding_request: boolean;
    detected_language: string | null;
    confidence: number;
    extracted_task: string | null;
    extracted_requirements: string[];
  }> {
    const res = await fetch(`${API_BASE}/ai/intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    return handleResponse(res);
  },

  async generateCode(data: {
    note_id?: string;
    instruction: string;
    language: string;
  }): Promise<{
    generated_code: string;
    explanation: string;
    language: string;
    revision_id?: string;
    revision_number?: number;
    validation_status: string;
    model_used: string;
  }> {
    const res = await fetch(`${API_BASE}/ai/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  // Validation & Execution
  async validateCode(code: string, language: string): Promise<ValidationResult> {
    const res = await fetch(`${API_BASE}/validation/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, language })
    });
    return handleResponse<ValidationResult>(res);
  },

  async executeCode(code: string, language: string, stdin_data?: string): Promise<ExecutionResult> {
    const res = await fetch(`${API_BASE}/validation/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, language, stdin_data })
    });
    return handleResponse<ExecutionResult>(res);
  },

  // Voice
  async parseVoiceCommand(transcript: string): Promise<VoiceCommandResponse> {
    const res = await fetch(`${API_BASE}/voice/command`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript })
    });
    return handleResponse<VoiceCommandResponse>(res);
  },

  async transcribeAudio(blob: Blob): Promise<{ success: boolean; transcript: string; error?: string }> {
    const formData = new FormData();
    formData.append('audio', blob, 'recording.wav');
    const res = await fetch(`${API_BASE}/voice/transcribe`, {
      method: 'POST',
      body: formData
    });
    return handleResponse(res);
  },

  // System
  async getSystemStatus(): Promise<SystemStatus> {
    const res = await fetch(`${API_BASE}/system/status`);
    return handleResponse<SystemStatus>(res);
  },

  async createBackup(): Promise<{ success: boolean; backup_file: string; created_at: string }> {
    const res = await fetch(`${API_BASE}/system/backup`, { method: 'POST' });
    return handleResponse(res);
  },

  async getSettings(): Promise<Record<string, any>> {
    const res = await fetch(`${API_BASE}/system/settings`);
    return handleResponse(res);
  },

  async saveSettings(data: Record<string, any>): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/system/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  }
};
