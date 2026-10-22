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

  // Modals state
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [revisionsModalOpen, setRevisionsModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);

  const autoSaveTimerRef = useRef<any>(null);

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

  // Debounced Auto-Save
  const triggerAutoSave = (updatedNote: Note) => {
    setSaveStatus('unsaved');
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);

    autoSaveTimerRef.current = setTimeout(async () => {
      setSaveStatus('saving');
      try {
        const saved = await api.updateNote(updatedNote.id, {
          title: updatedNote.title,
          content: updatedNote.content,
          note_type: updatedNote.note_type,
          category_id: updatedNote.category_id,
          tags: updatedNote.tags,
          language: updatedNote.language,
          generated_code: updatedNote.generated_code,
          explanation: updatedNote.explanation,
          is_favorite: updatedNote.is_favorite,
          is_pinned: updatedNote.is_pinned
        });

        // Also save draft for instant crash recovery
        await api.saveDraft(updatedNote.id, {
          title: updatedNote.title,
          content: updatedNote.content,
          generated_code: updatedNote.generated_code,
          language: updatedNote.language
        });

        // Update list
        setNotes(prev => prev.map(n => n.id === saved.id ? saved : n));
        setSaveStatus('saved');
      } catch (err) {
        console.error('Autosave error:', err);
        setSaveStatus('error');
      }
    }, 500);
  };

  // Note updates from Editor Area
  const handleUpdateNote = (updates: Partial<Note>) => {
    if (!activeNote) return;
    const updated: Note = { ...activeNote, ...updates };
    setActiveNote(updated);
    setNotes(prev => prev.map(n => n.id === updated.id ? updated : n));
    triggerAutoSave(updated);
  };

  // Create New Note
  const handleNewNote = async () => {
    try {
      const newNote = await api.createNote({
        title: 'Untitled Note',
        content: '',
        note_type: 'auto',
        category_id: selectedCategory,
        tags: selectedTag ? [selectedTag] : [],
        language: 'python'
      });
      setNotes(prev => [newNote, ...prev]);
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
        await api.deleteNote(activeNote.id);
        const remaining = notes.filter(n => n.id !== activeNote.id);
        setNotes(remaining);
        setActiveNote(remaining.length > 0 ? remaining[0] : null);
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

  // Select Note from Search or Sidebar
  const handleSelectNoteById = (noteId: string) => {
    const found = notes.find(n => n.id === noteId);
    if (found) {
      setActiveNote(found);
      setMobileTab('editor');
    } else {
      api.getNote(noteId).then(n => {
        setActiveNote(n);
        setNotes(prev => [n, ...prev.filter(x => x.id !== n.id)]);
        setMobileTab('editor');
      }).catch(console.error);
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
        if (activeNote) triggerAutoSave(activeNote);
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

      {/* Main Workspace Canvas */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Sidebar */}
        <div className={`${mobileTab === 'notes' ? 'flex' : 'hidden'} lg:flex w-full lg:w-auto h-full shrink-0`}>
          <Sidebar
            notes={notes}
            activeNoteId={activeNote?.id || null}
            onSelectNote={n => {
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
          />
        </div>

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

        {/* Right Code Output Panel */}
        <div className={`${mobileTab === 'code' ? 'flex' : 'hidden'} lg:flex w-full lg:w-1/2 h-full min-w-0`}>
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
            mobileTab === 'notes' ? 'text-blue-400 font-semibold' : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <div className="relative">
            <FileText className="w-5 h-5" />
            <span className="absolute -top-1 -right-2 text-[9px] px-1 rounded-full bg-blue-500/20 text-blue-300 font-mono">
              {notes.length}
            </span>
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight">Notes</span>
        </button>

        <button
          onClick={() => setMobileTab('editor')}
          className={`flex flex-col items-center justify-center flex-1 py-1 mac-btn transition ${
            mobileTab === 'editor' ? 'text-blue-400 font-semibold' : 'text-gray-400 hover:text-gray-200'
          }`}
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
            mobileTab === 'code' ? 'text-blue-400 font-semibold' : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <div className="relative">
            <Code2 className="w-5 h-5" />
            {activeNote?.generated_code && (
              <span className="absolute -top-0.5 -right-1 w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
            )}
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight">Code</span>
        </button>

        <button
          onClick={() => setVoiceModalOpen(true)}
          className="flex flex-col items-center justify-center flex-1 py-1 mac-btn text-gray-400 hover:text-gray-200 transition"
          title="Voice Assistant"
        >
          <Mic className="w-5 h-5 text-indigo-400" />
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
          setNotes(prev => prev.map(n => n.id === revised.id ? revised : n));
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
