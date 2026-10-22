import React, { useState, useEffect, useRef } from 'react';
import {
  FileText, Code, Sparkles, Tag, Folder, Plus, X,
  CheckCircle, AlertCircle, RefreshCw, Wand2, Star, Trash2,
  Bold, Italic, List, Quote, Copy, Check, Zap, Command
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
        <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4 shadow-sm">
          <FileText className="w-7 h-7" />
        </div>
        <h2 className="text-sm font-semibold text-white tracking-tight mb-1">No Note Selected</h2>
        <p className="text-xs text-gray-400 max-w-sm leading-relaxed">
          Select a document from the left library or click <span className="text-blue-400 font-semibold">+ New Note</span> to start drafting.
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
      className="flex-1 flex flex-col h-full border-r overflow-hidden select-none"
      style={{
        backgroundColor: 'var(--bg-canvas)',
        borderColor: 'var(--border-subtle)'
      }}
    >
      {/* macOS Top Mode & Action Bar */}
      <div
        className="h-11 px-4 border-b flex items-center justify-between gap-3 mac-acrylic z-10"
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
              className={`px-3 py-1 text-[11px] font-semibold rounded-md capitalize transition ${
                note.note_type === mode
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {mode} Mode
            </button>
          ))}
        </div>

        {/* Intent Detection Notification Pill */}
        {intentInfo && note.note_type === 'auto' && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium border bg-blue-500/10 border-blue-500/25 text-blue-300">
            {intentInfo.is_coding ? (
              <>
                <Zap className="w-3 h-3 text-amber-400 animate-pulse" />
                <span>Coding Task: {intentInfo.language ? intentInfo.language.toUpperCase() : 'DETECTED'}</span>
              </>
            ) : (
              <>
                <FileText className="w-3 h-3 text-emerald-400" />
                <span>Text Note</span>
              </>
            )}
          </div>
        )}

        {/* Right Note Actions */}
        <div className="flex items-center gap-1.5">
          {/* Copy Full Note */}
          <button
            onClick={handleCopyNote}
            title="Copy Note Content"
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.06] mac-btn transition"
          >
            {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          {/* Favorite Toggle */}
          <button
            onClick={() => onUpdateNote({ is_favorite: !note.is_favorite })}
            title={note.is_favorite ? 'Remove Favorite' : 'Mark Favorite'}
            className={`p-1.5 rounded-lg mac-btn transition ${
              note.is_favorite ? 'text-amber-400 hover:bg-amber-400/15' : 'text-gray-400 hover:text-white hover:bg-white/[0.06]'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${note.is_favorite ? 'fill-amber-400' : ''}`} />
          </button>

          {/* Delete Note */}
          <button
            onClick={onDeleteNote}
            title="Delete Note"
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/15 mac-btn transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Note Title & Metadata Shelf */}
      <div className="px-6 pt-4 pb-3 border-b space-y-3" style={{ borderColor: 'var(--border-subtle)' }}>
        {/* Title Input */}
        <input
          type="text"
          value={note.title}
          onChange={e => onUpdateNote({ title: e.target.value })}
          placeholder="Untitled Note..."
          className="w-full bg-transparent text-xl font-bold tracking-tight text-white placeholder-gray-500 outline-none"
        />

        {/* Metadata Controls Row */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          {/* Category Dropdown Pill */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border mac-transition"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              borderColor: 'var(--border-card)'
            }}
          >
            <Folder className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <select
              value={note.category_id || ''}
              onChange={e => onUpdateNote({ category_id: e.target.value || null })}
              className="bg-transparent text-gray-200 outline-none cursor-pointer text-xs pr-1 font-medium"
            >
              <option value="" className="bg-[#0f172a] text-gray-400">Select Category</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id} className="bg-[#0f172a] text-gray-200">
                  {cat.name}
                </option>
              ))}
            </select>

            <button
              onClick={handleAutoSuggestCategory}
              disabled={isSuggestingCat}
              title="Auto-categorize with local AI"
              className="p-1 rounded text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 mac-btn transition"
            >
              <Wand2 className={`w-3 h-3 ${isSuggestingCat ? 'animate-spin text-amber-400' : ''}`} />
            </button>
          </div>

          {/* Tags Chips List */}
          <div className="flex flex-wrap items-center gap-1.5">
            {note.tags.map(t => (
              <span
                key={t}
                className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-white/[0.06] text-gray-300 border border-white/[0.08]"
              >
                #{t}
                <button
                  onClick={() => handleRemoveTag(t)}
                  className="hover:text-red-400 p-0.5 rounded"
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
              className="bg-transparent text-gray-300 placeholder-gray-500 text-xs px-2 py-0.5 outline-none w-20 hover:w-28 focus:w-28 transition-all"
            />
          </div>
        </div>

        {/* Quick Markdown Formatting Toolbar */}
        <div className="flex items-center gap-1 pt-1 text-gray-400 text-xs">
          <button
            onClick={() => insertFormatting('**', '**')}
            title="Bold (**text**)"
            className="p-1.5 rounded hover:text-white hover:bg-white/[0.06] mac-btn"
          >
            <Bold className="w-3 h-3" />
          </button>
          <button
            onClick={() => insertFormatting('*', '*')}
            title="Italic (*text*)"
            className="p-1.5 rounded hover:text-white hover:bg-white/[0.06] mac-btn"
          >
            <Italic className="w-3 h-3" />
          </button>
          <button
            onClick={() => insertFormatting('```\n', '\n```')}
            title="Code Block"
            className="p-1.5 rounded hover:text-white hover:bg-white/[0.06] mac-btn"
          >
            <Code className="w-3 h-3" />
          </button>
          <button
            onClick={() => insertFormatting('- ')}
            title="Bullet List"
            className="p-1.5 rounded hover:text-white hover:bg-white/[0.06] mac-btn"
          >
            <List className="w-3 h-3" />
          </button>
          <button
            onClick={() => insertFormatting('> ')}
            title="Quote"
            className="p-1.5 rounded hover:text-white hover:bg-white/[0.06] mac-btn"
          >
            <Quote className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Main Text Content Area */}
      <div className="flex-1 px-6 py-4 flex flex-col min-h-0 relative">
        <textarea
          ref={textareaRef}
          value={note.content}
          onChange={e => onUpdateNote({ content: e.target.value })}
          placeholder={
            note.note_type === 'code'
              ? "Describe your programming task in ordinary English...\n\nExample:\n'Write a Python program that accepts a list of numbers, removes duplicate values and prints the numbers in ascending order.'"
              : "Type notes, algorithms, architectural specs, or technical thoughts here..."
          }
          className="flex-1 w-full bg-transparent text-sm leading-relaxed text-gray-100 placeholder-gray-500 outline-none resize-none font-sans"
          style={{ lineHeight: '1.7' }}
        />

        {/* Floating Quick Action Banner when Code Mode is active or Auto Mode detects coding task */}
        {(note.note_type === 'code' || (note.note_type === 'auto' && intentInfo?.is_coding)) && note.content.trim().length > 0 && (
          <div
            className={`absolute bottom-4 left-6 right-6 p-3 rounded-xl border mac-acrylic mac-window-shadow flex items-center justify-between gap-3 ${
              isGenerating ? 'ai-shimmer' : ''
            }`}
            style={{
              backgroundColor: 'var(--bg-surface-elevated)',
              borderColor: isGenerating ? 'var(--accent-mac)' : 'var(--border-card)'
            }}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Sparkles className="w-4 h-4 animate-spin-slow" />
              </div>
              <div className="text-left">
                <div className="text-xs font-semibold text-white tracking-tight">
                  {isGenerating ? 'Generating Code with Local Qwen AI...' : 'Ready to Convert to Code'}
                </div>
                <div className="text-[10px] text-gray-400">
                  Target: {note.language?.toUpperCase() || 'PYTHON'} • 100% Offline & Private
                </div>
              </div>
            </div>

            <button
              onClick={onGenerateCode}
              disabled={isGenerating}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-xs mac-btn transition active:scale-95 disabled:opacity-50"
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

      {/* Editor Footer */}
      <div
        className="h-9 px-4 border-t flex items-center justify-between text-[11px] text-gray-400 mac-acrylic"
        style={{
          backgroundColor: 'var(--bg-header)',
          borderColor: 'var(--border-subtle)'
        }}
      >
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${
            saveStatus === 'saved' ? 'bg-emerald-400' :
            saveStatus === 'saving' ? 'bg-amber-400 animate-pulse' : 'bg-blue-400'
          }`} />
          <span className="capitalize text-gray-300 font-medium">{saveStatus} offline</span>
          <span className="text-gray-600">|</span>
          <span>{note.content.trim() ? note.content.trim().split(/\s+/).length : 0} words</span>
          <span className="text-gray-600">•</span>
          <span>{note.content.length} characters</span>
        </div>

        <div className="text-[10px] text-gray-500 font-mono">
          Markdown Enabled
        </div>
      </div>
    </div>
  );
};

