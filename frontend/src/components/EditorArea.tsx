import React, { useState, useEffect, useRef } from 'react';
import {
  FileText, Code, Sparkles, Tag, Folder, Plus, X,
  CheckCircle, AlertCircle, RefreshCw, Wand2, Star, Trash2,
  Bold, Italic, List, Quote, Copy, Check, Zap, Command, Pin
} from 'lucide-react';
import { Note, Category, NoteType, SaveStatus } from '../types';
import { api } from '../services/api';

interface EditorAreaProps {
  note: Note | null;
  onUpdateNote: (updates: Partial<Note>) => void;
  onDeleteNote: () => void;
  categories: Category[];
  onGenerateCode: () => void;
  isGenerating: boolean;
  saveStatus: SaveStatus;
}

export const EditorArea: React.FC<EditorAreaProps> = ({
  note,
  onUpdateNote,
  onDeleteNote,
  categories,
  onGenerateCode,
  isGenerating,
  saveStatus
}) => {
  const [tagInput, setTagInput] = useState('');
  const [intentInfo, setIntentInfo] = useState<{ is_coding: boolean; language: string | null } | null>(null);
  const [isSuggestingCat, setIsSuggestingCat] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto detect intent when content changes
  useEffect(() => {
    if (!note?.content) {
      setIntentInfo(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await api.detectIntent(note.content);
        setIntentInfo({
          is_coding: res.is_coding_request,
          language: res.detected_language
        });
      } catch (e) {
        // graceful offline fallback
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [note?.content]);

  // Shortcut Cmd+Enter / Ctrl+Enter to trigger code generation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        if ((note?.note_type === 'code' || note?.note_type === 'auto') && note.content.trim()) {
          e.preventDefault();
          onGenerateCode();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [note, onGenerateCode]);

  if (!note) {
    return (
      <div
        className="flex-1 flex flex-col items-center justify-center p-8 text-center select-none"
        style={{ backgroundColor: 'var(--bg-canvas)' }}
      >
        <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 mb-4 shadow-sm">
          <FileText className="w-7 h-7" />
        </div>
        <h2 className="text-sm font-semibold tracking-tight mb-1" style={{ color: 'var(--text-primary)' }}>No Note Selected</h2>
        <p className="text-xs max-w-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          Select a document from the left library or click <span className="text-blue-500 font-semibold">+ New Note</span> to start drafting.
        </p>
      </div>
    );
  }

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim().replace(/^#/, '');
      if (!note.tags.includes(newTag)) {
        onUpdateNote({ tags: [...note.tags, newTag] });
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onUpdateNote({ tags: note.tags.filter(t => t !== tagToRemove) });
  };

  const handleAutoSuggestCategory = async () => {
    if (!note.title && !note.content) return;
    setIsSuggestingCat(true);
    try {
      const res = await api.suggestCategory(note.title, note.content);
      if (res.suggested_category_id) {
        onUpdateNote({
          category_id: res.suggested_category_id,
          tags: Array.from(new Set([...note.tags, ...res.suggested_tags]))
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSuggestingCat(false);
    }
  };

  const insertFormatting = (prefix: string, suffix: string = '') => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = note.content.substring(start, end);
    const replacement = prefix + (selected || 'text') + suffix;
    const newContent = note.content.substring(0, start) + replacement + note.content.substring(end);
    onUpdateNote({ content: newContent });
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + prefix.length, start + prefix.length + (selected ? selected.length : 4));
    }, 20);
  };

  const handleCopyNote = () => {
    navigator.clipboard.writeText(note.content);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  return (
    <div
      className="flex-1 flex flex-col h-full border-r lg:border-r-0 overflow-hidden select-none"
      style={{
        backgroundColor: 'var(--bg-canvas)',
        borderColor: 'var(--border-subtle)'
      }}
    >
      {/* macOS Top Mode & Action Bar */}
      <div
        className="h-11 px-3 sm:px-4 border-b flex items-center justify-between gap-2 sm:gap-3 mac-acrylic z-10 shrink-0"
        style={{
          backgroundColor: 'var(--bg-header)',
          borderColor: 'var(--border-subtle)'
        }}
      >
        {/* macOS Segmented Mode Switcher */}
        <div className="mac-segmented">
          {(['write', 'code', 'auto'] as NoteType[]).map(mode => (
            <button
              key={mode}
              onClick={() => onUpdateNote({ note_type: mode })}
              className={`px-2.5 sm:px-3 py-1 text-[10px] sm:text-[11px] font-semibold rounded-md capitalize transition ${
                note.note_type === mode
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'hover:text-blue-500'
              }`}
              style={{
                color: note.note_type === mode ? '#ffffff' : 'var(--text-secondary)'
              }}
            >
              {mode}
            </button>
          ))}
        </div>

        {/* Intent Detection Notification Pill */}
        {intentInfo && note.note_type === 'auto' && (
          <div className="hidden xs:flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-full text-[9px] sm:text-[10px] font-medium border bg-blue-500/10 border-blue-500/25 text-blue-600 dark:text-blue-300">
            {intentInfo.is_coding ? (
              <>
                <Zap className="w-3 h-3 text-amber-500 animate-pulse" />
                <span className="truncate max-w-[120px] sm:max-w-none">Coding: {intentInfo.language ? intentInfo.language.toUpperCase() : 'DETECTED'}</span>
              </>
            ) : (
              <>
                <FileText className="w-3 h-3 text-emerald-500" />
                <span>Text Note</span>
              </>
            )}
          </div>
        )}

        {/* Right Note Actions */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Copy Full Note */}
          <button
            onClick={handleCopyNote}
            title="Copy Note Content"
            className="p-1.5 rounded-lg hover:bg-[var(--bg-control-hover)] mac-btn transition"
            style={{ color: 'var(--text-secondary)' }}
          >
            {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          {/* Pin to Top Toggle */}
          <button
            onClick={() => onUpdateNote({ is_pinned: !note.is_pinned })}
            title={note.is_pinned ? 'Unpin Note' : 'Pin Note to Top'}
            className="p-1.5 rounded-lg mac-btn transition hover:bg-[var(--bg-control-hover)]"
            style={{ color: note.is_pinned ? 'var(--accent-mac)' : 'var(--text-secondary)' }}
          >
            <Pin className={`w-3.5 h-3.5 ${note.is_pinned ? 'fill-blue-500 text-blue-500' : ''}`} />
          </button>

          {/* Favorite Toggle */}
          <button
            onClick={() => onUpdateNote({ is_favorite: !note.is_favorite })}
            title={note.is_favorite ? 'Remove Favorite' : 'Mark Favorite'}
            className="p-1.5 rounded-lg mac-btn transition hover:bg-[var(--bg-control-hover)]"
            style={{ color: note.is_favorite ? '#eab308' : 'var(--text-secondary)' }}
          >
            <Star className={`w-3.5 h-3.5 ${note.is_favorite ? 'fill-amber-400 text-amber-400' : ''}`} />
          </button>

          {/* Delete Note */}
          <button
            onClick={onDeleteNote}
            title="Delete Note"
            className="p-1.5 rounded-lg hover:text-red-500 hover:bg-red-500/10 mac-btn transition"
            style={{ color: 'var(--text-secondary)' }}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Note Title & Metadata Shelf */}
      <div className="px-3.5 sm:px-6 pt-3 sm:pt-4 pb-2.5 sm:pb-3 border-b space-y-2.5 sm:space-y-3 shrink-0" style={{ borderColor: 'var(--border-subtle)' }}>
        {/* Title Input */}
        <input
          type="text"
          value={note.title}
          onChange={e => onUpdateNote({ title: e.target.value })}
          placeholder="Untitled Note..."
          className="w-full bg-transparent text-lg sm:text-xl font-bold tracking-tight outline-none"
          style={{ color: 'var(--text-primary)' }}
        />

        {/* Metadata Controls Row */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 text-xs">
          {/* Category Dropdown Pill */}
          <div
            className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg border mac-transition"
            style={{
              backgroundColor: 'var(--bg-control)',
              borderColor: 'var(--border-card)'
            }}
          >
            <Folder className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <select
              value={note.category_id || ''}
              onChange={e => onUpdateNote({ category_id: e.target.value || null })}
              className="bg-transparent outline-none cursor-pointer text-xs pr-1 font-medium max-w-[120px] sm:max-w-none truncate"
              style={{ color: 'var(--text-primary)' }}
            >
              <option value="" style={{ backgroundColor: 'var(--bg-surface-elevated)', color: 'var(--text-muted)' }}>Select Category</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id} style={{ backgroundColor: 'var(--bg-surface-elevated)', color: 'var(--text-primary)' }}>
                  {cat.name}
                </option>
              ))}
            </select>

            <button
              onClick={handleAutoSuggestCategory}
              disabled={isSuggestingCat}
              title="Auto-categorize with local AI"
              className="p-1 rounded text-blue-500 hover:bg-blue-500/20 mac-btn transition"
            >
              <Wand2 className={`w-3 h-3 ${isSuggestingCat ? 'animate-spin text-amber-500' : ''}`} />
            </button>
          </div>

          {/* Tags Chips List */}
          <div className="flex flex-wrap items-center gap-1.5">
            {note.tags.map(t => (
              <span
                key={t}
                className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border"
                style={{
                  backgroundColor: 'var(--bg-control)',
                  borderColor: 'var(--border-control)',
                  color: 'var(--text-secondary)'
                }}
              >
                #{t}
                <button
                  onClick={() => handleRemoveTag(t)}
                  className="hover:text-red-500 p-0.5 rounded"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            ))}

            <input
              type="text"
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              placeholder="+ add tag..."
              className="bg-transparent text-xs px-2 py-0.5 outline-none w-20 hover:w-28 focus:w-28 transition-all"
              style={{ color: 'var(--text-primary)' }}
            />
          </div>
        </div>

        {/* Quick Markdown Formatting Toolbar */}
        <div className="flex items-center gap-1 pt-1 text-xs overflow-x-auto no-scrollbar" style={{ color: 'var(--text-secondary)' }}>
          <button
            onClick={() => insertFormatting('**', '**')}
            title="Bold (**text**)"
            className="p-1.5 rounded hover:bg-[var(--bg-control-hover)] mac-btn shrink-0"
            style={{ color: 'var(--text-secondary)' }}
          >
            <Bold className="w-3 h-3" />
          </button>
          <button
            onClick={() => insertFormatting('*', '*')}
            title="Italic (*text*)"
            className="p-1.5 rounded hover:bg-[var(--bg-control-hover)] mac-btn shrink-0"
            style={{ color: 'var(--text-secondary)' }}
          >
            <Italic className="w-3 h-3" />
          </button>
          <button
            onClick={() => insertFormatting('```\n', '\n```')}
            title="Code Block"
            className="p-1.5 rounded hover:bg-[var(--bg-control-hover)] mac-btn shrink-0"
            style={{ color: 'var(--text-secondary)' }}
          >
            <Code className="w-3 h-3" />
          </button>
          <button
            onClick={() => insertFormatting('- ')}
            title="Bullet List"
            className="p-1.5 rounded hover:bg-[var(--bg-control-hover)] mac-btn shrink-0"
            style={{ color: 'var(--text-secondary)' }}
          >
            <List className="w-3 h-3" />
          </button>
          <button
            onClick={() => insertFormatting('> ')}
            title="Quote"
            className="p-1.5 rounded hover:bg-[var(--bg-control-hover)] mac-btn shrink-0"
            style={{ color: 'var(--text-secondary)' }}
          >
            <Quote className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Main Text Content Area */}
      <div className="flex-1 px-3.5 sm:px-6 py-3 sm:py-4 flex flex-col min-h-0 relative">
        <textarea
          ref={textareaRef}
          value={note.content}
          onChange={e => onUpdateNote({ content: e.target.value })}
          placeholder={
            note.note_type === 'code'
              ? "Describe your programming task in ordinary English...\n\nExample:\n'Write a Python program that accepts a list of numbers, removes duplicate values and prints the numbers in ascending order.'"
              : "Type notes, algorithms, architectural specs, or technical thoughts here..."
          }
          className="flex-1 w-full bg-transparent text-base sm:text-sm leading-relaxed outline-none resize-none font-sans"
          style={{
            color: 'var(--text-primary)',
            lineHeight: '1.7'
          }}
        />

        {/* Floating Quick Action Banner when Code Mode is active or Auto Mode detects coding task */}
        {(note.note_type === 'code' || (note.note_type === 'auto' && intentInfo?.is_coding)) && note.content.trim().length > 0 && (
          <div
            className={`absolute bottom-16 sm:bottom-4 left-3 right-3 sm:left-6 sm:right-6 p-2.5 sm:p-3 rounded-xl border mac-acrylic mac-window-shadow flex items-center justify-between gap-2 sm:gap-3 z-20 ${
              isGenerating ? 'ai-shimmer' : ''
            }`}
            style={{
              backgroundColor: 'var(--bg-surface-elevated)',
              borderColor: isGenerating ? 'var(--accent-mac)' : 'var(--border-card)'
            }}
          >
            <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-blue-600/15 border border-blue-500/30 flex items-center justify-center text-blue-500 shrink-0">
                <Sparkles className="w-4 h-4 animate-spin-slow" />
              </div>
              <div className="text-left min-w-0">
                <div className="text-xs font-semibold tracking-tight truncate" style={{ color: 'var(--text-primary)' }}>
                  {isGenerating ? 'Generating Code with Local AI...' : 'Ready to Convert to Code'}
                </div>
                <div className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>
                  Target: {note.language?.toUpperCase() || 'PYTHON'}
                </div>
              </div>
            </div>

            <button
              onClick={onGenerateCode}
              disabled={isGenerating}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-xs mac-btn transition active:scale-95 disabled:opacity-50 shrink-0"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Thinking...</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5" />
                  <span>Generate Code</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Editor Footer (Desktop only) */}
      <div
        className="hidden sm:flex h-9 px-4 border-t items-center justify-between text-[11px] mac-acrylic shrink-0"
        style={{
          backgroundColor: 'var(--bg-header)',
          borderColor: 'var(--border-subtle)',
          color: 'var(--text-muted)'
        }}
      >
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${
            saveStatus === 'saved' ? 'bg-emerald-400' :
            saveStatus === 'saving' ? 'bg-amber-400 animate-pulse' : 'bg-blue-400'
          }`} />
          <span className="capitalize font-medium" style={{ color: 'var(--text-secondary)' }}>{saveStatus} offline</span>
          <span style={{ color: 'var(--text-muted)' }}>|</span>
          <span>{note.content.trim() ? note.content.trim().split(/\s+/).length : 0} words</span>
          <span style={{ color: 'var(--text-muted)' }}>•</span>
          <span>{note.content.length} characters</span>
        </div>

        <div className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
          Markdown Enabled
        </div>
      </div>
    </div>
  );
};

