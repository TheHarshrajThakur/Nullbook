import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopSearchBar } from './components/TopSearchBar';
import { EditorArea } from './components/EditorArea';
import { CodePanel } from './components/CodePanel';
import { VoiceModal } from './components/VoiceModal';
import { CategoryModal } from './components/CategoryModal';
import { RevisionHistoryModal } from './components/RevisionHistoryModal';
import { SettingsModal } from './components/SettingsModal';
import { StatusBar } from './components/StatusBar';
import { Note, Category, SystemStatus, SaveStatus, Theme } from './types';
import { api } from './services/api';
import { FileText, Edit3, Code2, Plus, Mic } from 'lucide-react';
import { PanelSplitter } from './components/PanelSplitter';

export function App() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [filterFavorites, setFilterFavorites] = useState(false);
  const [theme, setTheme] = useState<Theme>('dark');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [mobileTab, setMobileTab] = useState<'notes' | 'editor' | 'code'>('editor');

  // Resizable panel widths (persisted in localStorage like VS Code)
  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('nullbook_sidebar_width');
      return saved ? Math.max(160, Math.min(parseInt(saved, 10), 500)) : 280;
    } catch {
      return 280;
    }
  });

  const [codePanelWidth, setCodePanelWidth] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('nullbook_codepanel_width');
      return saved ? Math.max(260, Math.min(parseInt(saved, 10), 1200)) : 520;
    } catch {
      return 520;
    }
  });

  const [isResizing, setIsResizing] = useState(false);
  const [isDesktop, setIsDesktop] = useState(() => typeof window !== 'undefined' ? window.innerWidth >= 1024 : true);
  const workspaceRef = useRef<HTMLDivElement>(null);

  // Modals state
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [revisionsModalOpen, setRevisionsModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);

  // Pending auto-save tracker to guarantee zero data loss when switching notes or refreshing
  const pendingSaveRef = useRef<{ note: Note; timer: any } | null>(null);

  // Load initial data
  const loadInitialData = useCallback(async () => {
    try {
      const [fetchedCategories, fetchedNotes, status] = await Promise.all([
        api.getCategories(),
        api.getNotes(),
        api.getSystemStatus().catch(() => null)
      ]);
      setCategories(fetchedCategories);
      setNotes(fetchedNotes);
      setSystemStatus(status);

      if (fetchedNotes.length > 0 && !activeNote) {
        setActiveNote(fetchedNotes[0]);
      }
    } catch (e) {
      console.error('Failed to load initial workspace data:', e);
    }
  }, [activeNote]);

  useEffect(() => {
    loadInitialData();
  }, []);

  // Theme application
  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  }, [theme]);

  // Window resize observer to adapt panel widths smoothly
  useEffect(() => {
    const handleResize = () => {
      const desktop = window.innerWidth >= 1024;
      setIsDesktop(desktop);
      if (workspaceRef.current) {
        const rect = workspaceRef.current.getBoundingClientRect();
        const currentSidebarW = sidebarCollapsed ? 56 : sidebarWidth;
        const maxCodeW = rect.width - currentSidebarW - 280;
        if (maxCodeW > 260) {
          setCodePanelWidth(prev => Math.min(prev, maxCodeW));
        }
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [sidebarCollapsed, sidebarWidth]);

  // Handle Sidebar border dragging (VS Code style)
  const handleSidebarDrag = useCallback((e: { clientX: number }) => {
    if (!workspaceRef.current) return;
    const rect = workspaceRef.current.getBoundingClientRect();
    const rawWidth = e.clientX - rect.left;

    // Auto-collapse if dragged very small (< 85px)
    if (rawWidth < 85) {
      if (!sidebarCollapsed) setSidebarCollapsed(true);
    } else {
      if (sidebarCollapsed) setSidebarCollapsed(false);
      const maxSidebar = Math.min(500, Math.floor(rect.width * 0.42));
      const clamped = Math.max(170, Math.min(rawWidth, maxSidebar));
      setSidebarWidth(clamped);
      try {
        localStorage.setItem('nullbook_sidebar_width', String(clamped));
      } catch {}
    }
  }, [sidebarCollapsed]);

  const handleResetSidebar = useCallback(() => {
    setSidebarCollapsed(false);
    setSidebarWidth(280);
    try {
      localStorage.setItem('nullbook_sidebar_width', '280');
    } catch {}
  }, []);

  // Handle CodePanel border dragging (VS Code style)
  const handleCodePanelDrag = useCallback((e: { clientX: number }) => {
    if (!workspaceRef.current) return;
    const rect = workspaceRef.current.getBoundingClientRect();
    const rawWidth = rect.right - e.clientX;
    const currentSidebarW = sidebarCollapsed ? 56 : sidebarWidth;
    const maxCodeW = rect.width - currentSidebarW - 280;
    const clamped = Math.max(260, Math.min(rawWidth, Math.max(260, maxCodeW)));
    setCodePanelWidth(clamped);
    try {
      localStorage.setItem('nullbook_codepanel_width', String(clamped));
    } catch {}
  }, [sidebarCollapsed, sidebarWidth]);

  const handleResetCodePanel = useCallback(() => {
    if (!workspaceRef.current) return;
    const rect = workspaceRef.current.getBoundingClientRect();
    const currentSidebarW = sidebarCollapsed ? 56 : sidebarWidth;
    const available = rect.width - currentSidebarW;
    const half = Math.max(280, Math.round(available / 2));
    setCodePanelWidth(half);
    try {
      localStorage.setItem('nullbook_codepanel_width', String(half));
    } catch {}
  }, [sidebarCollapsed, sidebarWidth]);

  // Immediate note persistence to local SQLite DB
  const saveNoteDirectly = useCallback(async (noteToSave: Note) => {
    setSaveStatus('saving');
    try {
      const saved = await api.updateNote(noteToSave.id, {
        title: noteToSave.title,
        content: noteToSave.content,
        note_type: noteToSave.note_type,
        category_id: noteToSave.category_id,
        tags: noteToSave.tags,
        language: noteToSave.language,
        generated_code: noteToSave.generated_code,
        explanation: noteToSave.explanation,
        is_favorite: noteToSave.is_favorite,
        is_pinned: noteToSave.is_pinned
      });

      // Update notes list: keep saved note updated and floated to top of recent
      setNotes(prev => [saved, ...prev.filter(n => n.id !== saved.id)]);
      setSaveStatus('saved');
      return saved;
    } catch (err) {
      console.error('Failed to save note:', err);
      setSaveStatus('error');
      throw err;
    }
  }, []);

  // Flush any pending debounced save immediately (called before switching notes, creating notes, or closing)
  const flushPendingSave = useCallback(async () => {
    if (pendingSaveRef.current) {
      const { note, timer } = pendingSaveRef.current;
      if (timer) clearTimeout(timer);
      pendingSaveRef.current = null;
      try {
        await saveNoteDirectly(note);
      } catch (e) {
        console.error('Failed to flush pending save:', e);
      }
    }
  }, [saveNoteDirectly]);

  // Debounced Auto-Save
  const triggerAutoSave = useCallback((updatedNote: Note) => {
    setSaveStatus('unsaved');
    if (pendingSaveRef.current?.timer) {
      clearTimeout(pendingSaveRef.current.timer);
    }

    const timer = setTimeout(async () => {
      if (pendingSaveRef.current && pendingSaveRef.current.note.id === updatedNote.id) {
        pendingSaveRef.current = null;
        try {
          await saveNoteDirectly(updatedNote);
        } catch (err) {
          console.error('Autosave error:', err);
        }
      }
    }, 450);

    pendingSaveRef.current = { note: updatedNote, timer };
  }, [saveNoteDirectly]);

  // Global Ctrl+S / Cmd+S shortcut to manually save current note immediately
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (pendingSaveRef.current) {
          flushPendingSave();
        } else if (activeNote) {
          saveNoteDirectly(activeNote);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeNote, flushPendingSave, saveNoteDirectly]);

  // Flush pending save when window unloads or reloads
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (pendingSaveRef.current) {
        const { note } = pendingSaveRef.current;
        api.updateNote(note.id, {
          title: note.title,
          content: note.content,
          note_type: note.note_type,
          category_id: note.category_id,
          tags: note.tags,
          language: note.language,
          generated_code: note.generated_code,
          explanation: note.explanation,
          is_favorite: note.is_favorite,
          is_pinned: note.is_pinned
        }).catch(() => {});
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Note updates from Editor Area (real-time recent sorting & auto-save)
  const handleUpdateNote = (updates: Partial<Note>) => {
    if (!activeNote) return;
    const nowIso = new Date().toISOString();
    const updated: Note = { ...activeNote, ...updates, updated_at: nowIso };
    setActiveNote(updated);
    // Move recently updated note immediately to the top of the notes explorer
    setNotes(prev => [updated, ...prev.filter(n => n.id !== updated.id)]);
    triggerAutoSave(updated);
  };

  // Create New Note (flushes any unsaved edits first)
  const handleNewNote = async () => {
    await flushPendingSave();
    try {
      const newNote = await api.createNote({
        title: 'Untitled Note',
        content: '',
        note_type: 'auto',
        category_id: selectedCategory,
        tags: selectedTag ? [selectedTag] : [],
        language: 'python'
      });
      setNotes(prev => [newNote, ...prev.filter(n => n.id !== newNote.id)]);
      setActiveNote(newNote);
      setSaveStatus('saved');
      setMobileTab('editor');
    } catch (e) {
      console.error('Failed to create note:', e);
    }
  };

  // Delete Note
  const handleDeleteNote = async () => {
    if (!activeNote) return;
    if (confirm(`Move note "${activeNote.title}" to trash?`)) {
      try {
        if (pendingSaveRef.current?.timer) {
          clearTimeout(pendingSaveRef.current.timer);
          pendingSaveRef.current = null;
        }
        await api.deleteNote(activeNote.id);
        const remaining = notes.filter(n => n.id !== activeNote.id);
        setNotes(remaining);
        setActiveNote(remaining.length > 0 ? remaining[0] : null);
        setSaveStatus('saved');
      } catch (e) {
        console.error('Failed to delete note:', e);
      }
    }
  };

  // Code Generation Action
  const handleGenerateCode = async () => {
    if (!activeNote || !activeNote.content.trim()) return;
    setIsGenerating(true);
    try {
      const res = await api.generateCode({
        note_id: activeNote.id,
        instruction: activeNote.content,
        language: activeNote.language || 'python'
      });

      const updated: Note = {
        ...activeNote,
        generated_code: res.generated_code,
        explanation: res.explanation,
        validation_status: res.validation_status,
        revisions_count: (activeNote.revisions_count || 0) + 1
      };

      setActiveNote(updated);
      setNotes(prev => prev.map(n => n.id === updated.id ? updated : n));
      setSaveStatus('saved');
      // Automatically switch to code view on small screens so the result is immediately visible
      setMobileTab('code');
    } catch (e: any) {
      alert(e.message || 'Code generation failed. Ensure local Ollama model is available.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Code Panel Updates
  const handleUpdateCode = (code: string, language: string, explanation?: string) => {
    handleUpdateNote({
      generated_code: code,
      language: language,
      explanation: explanation !== undefined ? explanation : activeNote?.explanation
    });
  };

  // Select Note from Search or Sidebar (flushes unsaved note first)
  const handleSelectNoteById = async (noteId: string) => {
    if (activeNote && activeNote.id === noteId) {
      setMobileTab('editor');
      return;
    }
    await flushPendingSave();
    const found = notes.find(n => n.id === noteId);
    if (found) {
      setActiveNote(found);
      setMobileTab('editor');
    } else {
      try {
        const n = await api.getNote(noteId);
        setActiveNote(n);
        setNotes(prev => [n, ...prev.filter(x => x.id !== n.id)]);
        setMobileTab('editor');
      } catch (e) {
        console.error(e);
      }
    }
  };

  // Handle Voice Command
  const handleExecuteVoiceAction = (action: string, params: Record<string, any>) => {
    switch (action) {
      case 'create_note':
        handleNewNote();
        break;
      case 'generate_code':
        if (params.language && activeNote) {
          handleUpdateNote({ language: params.language });
        }
        handleGenerateCode();
        break;
      case 'switch_language':
        if (params.language && activeNote) {
          handleUpdateNote({ language: params.language });
        }
        break;
      case 'categorize_note':
        if (activeNote) {
          api.suggestCategory(activeNote.title, activeNote.content).then(sug => {
            if (sug.suggested_category_id) {
              handleUpdateNote({
                category_id: sug.suggested_category_id,
                tags: Array.from(new Set([...activeNote.tags, ...sug.suggested_tags]))
              });
            }
          });
        }
        break;
      case 'open_category':
        if (params.category) {
          const cat = categories.find(c => c.name.toLowerCase().includes(params.category.toLowerCase()));
          if (cat) setSelectedCategory(cat.id);
        }
        break;
      case 'delete_note':
        handleDeleteNote();
        break;
      case 'save_note':
        if (activeNote) {
          if (pendingSaveRef.current) {
            flushPendingSave();
          } else {
            saveNoteDirectly(activeNote);
          }
        }
        break;
      default:
        break;
    }
  };

  // Handle Voice Dictation Insertion
  const handleInsertDictation = (dictatedText: string) => {
    if (!activeNote) return;
    const current = activeNote.content ? activeNote.content + '\n' : '';
    handleUpdateNote({ content: current + dictatedText });
  };

  const wordCount = activeNote?.content ? activeNote.content.trim().split(/\s+/).length : 0;
  const charCount = activeNote?.content ? activeNote.content.length : 0;

  return (
    <div className="flex flex-col h-screen min-h-[100dvh] w-screen overflow-hidden select-none"
         style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Top Search Bar */}
      <TopSearchBar
        onSelectResult={handleSelectNoteById}
        onOpenVoice={() => setVoiceModalOpen(true)}
        theme={theme}
        onToggleTheme={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
        offlineStatus={systemStatus?.ollama_status || 'offline'}
        onOpenMobileNotes={() => setMobileTab('notes')}
      />

      {/* Main Workspace Canvas with VS Code Style Draggable Border Resizing */}
      <div className="flex-1 flex overflow-hidden relative" ref={workspaceRef}>
        {/* Left Sidebar */}
        <div
          className={`${mobileTab === 'notes' ? 'flex' : 'hidden'} lg:flex w-full lg:w-auto h-full shrink-0`}
          style={{
            width: isDesktop ? (sidebarCollapsed ? 56 : sidebarWidth) : '100%',
            transition: isResizing ? 'none' : undefined
          }}
        >
          <Sidebar
            notes={notes}
            activeNoteId={activeNote?.id || null}
            onSelectNote={async n => {
              if (activeNote && activeNote.id === n.id) {
                setMobileTab('editor');
                return;
              }
              await flushPendingSave();
              setActiveNote(n);
              setMobileTab('editor');
            }}
            onNewNote={() => {
              handleNewNote();
              setMobileTab('editor');
            }}
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={catId => setSelectedCategory(catId)}
            filterFavorites={filterFavorites}
            onToggleFilterFavorites={() => setFilterFavorites(f => !f)}
            selectedTag={selectedTag}
            onSelectTag={tag => setSelectedTag(tag)}
            onOpenCategoryManager={() => setCategoryModalOpen(true)}
            onOpenSettings={() => setSettingsModalOpen(true)}
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(c => !c)}
            onMobileSelectNote={() => setMobileTab('editor')}
            isResizing={isResizing}
          />
        </div>

        {/* VS Code Style Splitter 1: Sidebar <-> Editor Area */}
        <PanelSplitter
          direction="col"
          onDragStart={() => setIsResizing(true)}
          onDragEnd={() => setIsResizing(false)}
          onDrag={handleSidebarDrag}
          onDoubleClick={handleResetSidebar}
          title="Drag border to resize sidebar • Double-click to reset (280px)"
        />

        {/* Central Writing Area */}
        <div className={`${mobileTab === 'editor' ? 'flex' : 'hidden'} lg:flex flex-1 h-full min-w-0`}>
          <EditorArea
            note={activeNote}
            onUpdateNote={handleUpdateNote}
            onDeleteNote={handleDeleteNote}
            categories={categories}
            onGenerateCode={handleGenerateCode}
            isGenerating={isGenerating}
            saveStatus={saveStatus}
          />
        </div>

        {/* VS Code Style Splitter 2: Editor Area <-> Code Output Panel */}
        <PanelSplitter
          direction="col"
          onDragStart={() => setIsResizing(true)}
          onDragEnd={() => setIsResizing(false)}
          onDrag={handleCodePanelDrag}
          onDoubleClick={handleResetCodePanel}
          title="Drag border to resize code panel • Double-click to balance (50%)"
        />

        {/* Right Code Output Panel */}
        <div
          className={`${mobileTab === 'code' ? 'flex' : 'hidden'} lg:flex w-full lg:w-auto h-full min-w-0 shrink-0`}
          style={{
            width: isDesktop ? codePanelWidth : '100%',
            transition: isResizing ? 'none' : undefined
          }}
        >
          <CodePanel
            note={activeNote}
            onUpdateCode={handleUpdateCode}
            onGenerateCode={handleGenerateCode}
            isGenerating={isGenerating}
            onOpenRevisions={() => setRevisionsModalOpen(true)}
          />
        </div>
      </div>

      {/* Mobile Glassmorphic Bottom Navigation Bar (Visible on mobile/tablet, hidden on desktop lg:) */}
      <nav
        aria-label="Mobile Navigation"
        className="lg:hidden h-14 px-3 flex items-center justify-around border-t mac-acrylic z-40 shrink-0"
        style={{
          backgroundColor: 'var(--bg-header)',
          borderColor: 'var(--border-subtle)'
        }}
      >
        <button
          onClick={() => setMobileTab('notes')}
          className={`flex flex-col items-center justify-center flex-1 py-1 mac-btn transition ${
            mobileTab === 'notes' ? 'font-semibold' : 'hover:opacity-80'
          }`}
          style={{
            color: mobileTab === 'notes' ? 'var(--accent-mac)' : 'var(--text-secondary)'
          }}
        >
          <div className="relative">
            <FileText className="w-5 h-5" />
            <span
              className="absolute -top-1 -right-2 text-[9px] px-1 rounded-full font-mono"
              style={{
                backgroundColor: 'rgba(2, 132, 199, 0.15)',
                color: 'var(--accent-mac)'
              }}
            >
              {notes.length}
            </span>
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight">Notes</span>
        </button>

        <button
          onClick={() => setMobileTab('editor')}
          className={`flex flex-col items-center justify-center flex-1 py-1 mac-btn transition ${
            mobileTab === 'editor' ? 'font-semibold' : 'hover:opacity-80'
          }`}
          style={{
            color: mobileTab === 'editor' ? 'var(--accent-mac)' : 'var(--text-secondary)'
          }}
        >
          <Edit3 className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 tracking-tight">Editor</span>
        </button>

        {/* Quick New Note Floating Action Button */}
        <button
          onClick={() => {
            handleNewNote();
            setMobileTab('editor');
          }}
          className="flex items-center justify-center w-10 h-10 -mt-3 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-lg mac-btn active:scale-95 transition"
          title="Create New Note"
        >
          <Plus className="w-5 h-5" />
        </button>

        <button
          onClick={() => setMobileTab('code')}
          className={`flex flex-col items-center justify-center flex-1 py-1 mac-btn transition ${
            mobileTab === 'code' ? 'font-semibold' : 'hover:opacity-80'
          }`}
          style={{
            color: mobileTab === 'code' ? 'var(--accent-mac)' : 'var(--text-secondary)'
          }}
        >
          <div className="relative">
            <Code2 className="w-5 h-5" />
            {activeNote?.generated_code && (
              <span className="absolute -top-0.5 -right-1 w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
            )}
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight">Code</span>
        </button>

        <button
          onClick={() => setVoiceModalOpen(true)}
          className="flex flex-col items-center justify-center flex-1 py-1 mac-btn transition hover:opacity-80"
          style={{ color: 'var(--text-secondary)' }}
          title="Voice Assistant"
        >
          <Mic className="w-5 h-5 text-indigo-500" />
          <span className="text-[10px] mt-0.5 tracking-tight">Voice</span>
        </button>
      </nav>

      {/* Desktop/Tablet Status Bar (Hidden on small mobile screens to keep space clean) */}
      <div className="hidden md:block">
        <StatusBar
          systemStatus={systemStatus}
          saveStatus={saveStatus}
          wordCount={wordCount}
          charCount={charCount}
        />
      </div>

      {/* Modals */}
      <VoiceModal
        isOpen={voiceModalOpen}
        onClose={() => setVoiceModalOpen(false)}
        onExecuteAction={handleExecuteVoiceAction}
        onInsertDictation={handleInsertDictation}
      />

      <CategoryModal
        isOpen={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        categories={categories}
        onRefreshCategories={() => api.getCategories().then(setCategories)}
      />

      <RevisionHistoryModal
        isOpen={revisionsModalOpen}
        onClose={() => setRevisionsModalOpen(false)}
        note={activeNote}
        onRestoreRevision={revised => {
          setActiveNote(revised);
          setNotes(prev => [revised, ...prev.filter(n => n.id !== revised.id)]);
        }}
      />

      <SettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        systemStatus={systemStatus}
        onRefreshStatus={() => api.getSystemStatus().then(setSystemStatus).catch(console.error)}
      />
    </div>
  );
}

export default App;
