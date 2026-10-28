import React from 'react';
import {
  FileText, Code, Star, Clock, Folder, Plus, Trash2,
  ChevronRight, ChevronDown, Tag, Sparkles, Settings as SettingsIcon,
  FolderPlus, Layers, Command, Pin, CheckCircle2
} from 'lucide-react';
import { Note, Category } from '../types';

interface SidebarProps {
  notes: Note[];
  activeNoteId: string | null;
  onSelectNote: (note: Note) => void;
  onNewNote: () => void;
  categories: Category[];
  selectedCategory: string | null;
  onSelectCategory: (catId: string | null) => void;
  filterFavorites: boolean;
  onToggleFilterFavorites: () => void;
  selectedTag: string | null;
  onSelectTag: (tag: string | null) => void;
  onOpenCategoryManager: () => void;
  onOpenSettings: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onMobileSelectNote?: () => void;
  isResizing?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  notes,
  activeNoteId,
  onSelectNote,
  onNewNote,
  categories,
  selectedCategory,
  onSelectCategory,
  filterFavorites,
  onToggleFilterFavorites,
  selectedTag,
  onSelectTag,
  onOpenCategoryManager,
  onOpenSettings,
  collapsed,
  onToggleCollapse,
  onMobileSelectNote,
  isResizing = false
}) => {
  const [categoriesOpen, setCategoriesOpen] = React.useState(true);
  const [tagsOpen, setTagsOpen] = React.useState(true);

  // Extract all unique tags
  const allTags = React.useMemo(() => {
    const set = new Set<string>();
    notes.forEach(n => (n.tags || []).forEach(t => set.add(t)));
    return Array.from(set).sort();
  }, [notes]);

  // Filter and sort notes on a recent basis (most recently edited at top, with pinned notes priority)
  const filteredNotes = React.useMemo(() => {
    return notes
      .filter(n => {
        if (filterFavorites && !n.is_favorite) return false;
        if (selectedCategory && n.category_id !== selectedCategory) return false;
        if (selectedTag && !(n.tags || []).includes(selectedTag)) return false;
        return true;
      })
      .sort((a, b) => {
        // Pinned notes stay at the top
        if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
        // Then sort on a recent basis (most recently updated first)
        const timeA = new Date(a.updated_at || a.created_at || 0).getTime();
        const timeB = new Date(b.updated_at || b.created_at || 0).getTime();
        return timeB - timeA;
      });
  }, [notes, filterFavorites, selectedCategory, selectedTag]);

  // Format relative date for note cards
  const formatCardDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours < 1) return 'Just now';
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffHours < 48) return 'Yesterday';
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  return (
    <aside
      className={`h-full w-full flex flex-col border-r lg:border-r-0 mac-acrylic select-none z-20 relative mac-inset-highlight ${
        isResizing ? '' : 'mac-transition'
      }`}
      style={{
        backgroundColor: 'var(--bg-sidebar)',
        borderColor: 'var(--border-subtle)'
      }}
    >
      {/* Sidebar Header & Brand */}
      <div className="p-3 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-subtle)' }}>
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-xs">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div className="text-left">
              <h2 className="text-xs font-semibold leading-none tracking-tight" style={{ color: 'var(--text-primary)' }}>
                Workspace
              </h2>
              <span className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>Offline Library</span>
            </div>
          </div>
        )}
        <button
          onClick={onToggleCollapse}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="p-1.5 rounded-lg mac-btn transition hover:bg-[var(--bg-control-hover)]"
          style={{ color: 'var(--text-secondary)' }}
        >
          <Layers className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* New Note Action Button */}
      <div className="p-2.5">
        <button
          onClick={onNewNote}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white text-xs font-semibold shadow-sm mac-btn transition active:scale-[0.98] group"
        >
          <Plus className="w-4 h-4 text-white group-hover:rotate-90 transition-transform duration-200" />
          {!collapsed && <span>New Note</span>}
        </button>
      </div>

      {/* Navigation & Notes Scroll Area */}
      <div className="flex-1 overflow-y-auto px-2 space-y-3.5 text-xs">
        {/* Quick Segmented Nav */}
        <div className="space-y-0.5">
          <button
            onClick={() => {
              onSelectCategory(null);
              onSelectTag(null);
              if (filterFavorites) onToggleFilterFavorites();
            }}
            className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg mac-transition ${
              !selectedCategory && !selectedTag && !filterFavorites
                ? 'bg-blue-600/10 text-blue-600 dark:text-blue-400 font-semibold shadow-2xs border border-blue-500/20'
                : 'hover:bg-[var(--bg-control-hover)]'
            }`}
            style={{
              color: !selectedCategory && !selectedTag && !filterFavorites ? undefined : 'var(--text-secondary)'
            }}
          >
            <Clock className="w-3.5 h-3.5 text-blue-500" />
            {!collapsed && <span className="flex-1 text-left">All Notes</span>}
            {!collapsed && (
              <span
                className="text-[10px] px-1.5 py-0.2 rounded-full font-mono"
                style={{ backgroundColor: 'var(--bg-control)', color: 'var(--text-muted)' }}
              >
                {notes.length}
              </span>
            )}
          </button>

          <button
            onClick={onToggleFilterFavorites}
            className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg mac-transition ${
              filterFavorites
                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold shadow-2xs border border-amber-500/25'
                : 'hover:bg-[var(--bg-control-hover)]'
            }`}
            style={{
              color: filterFavorites ? undefined : 'var(--text-secondary)'
            }}
          >
            <Star className="w-3.5 h-3.5 text-amber-500" />
            {!collapsed && <span className="flex-1 text-left">Favorites</span>}
            {!collapsed && (
              <span
                className="text-[10px] px-1.5 py-0.2 rounded-full font-mono"
                style={{ backgroundColor: 'var(--bg-control)', color: 'var(--text-muted)' }}
              >
                {notes.filter(n => n.is_favorite).length}
              </span>
            )}
          </button>
        </div>

        {/* Categories Section */}
        {!collapsed && (
          <div>
            <div className="flex items-center justify-between px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              <button
                onClick={() => setCategoriesOpen(!categoriesOpen)}
                className="flex items-center gap-1 hover:text-blue-500 transition"
              >
                {categoriesOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                <span>Categories</span>
              </button>
              <button
                onClick={onOpenCategoryManager}
                title="Manage Categories"
                className="hover:text-blue-500 p-0.5 rounded transition"
              >
                <FolderPlus className="w-3 h-3" />
              </button>
            </div>

            {categoriesOpen && (
              <div className="mt-1 space-y-0.5">
                {categories.map(cat => {
                  const isSelected = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => onSelectCategory(isSelected ? null : cat.id)}
                      className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg mac-transition text-xs ${
                        isSelected
                          ? 'bg-blue-600/10 text-blue-600 dark:text-blue-400 font-semibold border border-blue-500/20'
                          : 'hover:bg-[var(--bg-control-hover)]'
                      }`}
                      style={{
                        color: isSelected ? undefined : 'var(--text-secondary)'
                      }}
                    >
                      <span
                        className="w-2 h-2 rounded-full shrink-0 shadow-xs"
                        style={{ backgroundColor: cat.color || '#3b82f6' }}
                      />
                      <span className="flex-1 text-left truncate">{cat.name}</span>
                      <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>{cat.notes_count || 0}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tags Section */}
        {!collapsed && allTags.length > 0 && (
          <div>
            <div className="flex items-center justify-between px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              <button
                onClick={() => setTagsOpen(!tagsOpen)}
                className="flex items-center gap-1 hover:text-blue-500 transition"
              >
                {tagsOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                <span>Tags</span>
              </button>
            </div>

            {tagsOpen && (
              <div className="mt-1 flex flex-wrap gap-1 px-2">
                {allTags.map(tag => {
                  const isSelected = selectedTag === tag;
                  return (
                    <button
                      key={tag}
                      onClick={() => onSelectTag(isSelected ? null : tag)}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-2xs'
                          : 'hover:bg-[var(--bg-control-hover)]'
                      }`}
                      style={{
                        backgroundColor: isSelected ? undefined : 'var(--bg-control)',
                        color: isSelected ? '#ffffff' : 'var(--text-secondary)'
                      }}
                    >
                      #{tag}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Document History Note Cards (macOS / Notepad Style Recent Documents) */}
        {!collapsed && (
          <div className="pt-2 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
            <div className="px-2.5 pb-1.5 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              <span>Recent Documents ({filteredNotes.length})</span>
            </div>
            <div className="space-y-1">
              {filteredNotes.length === 0 ? (
                <div className="px-3 py-6 text-center text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                  No notes match current filter
                </div>
              ) : (
                filteredNotes.map(n => {
                  const isActive = n.id === activeNoteId;
                  return (
                    <div
                      key={n.id}
                      onClick={() => {
                        onSelectNote(n);
                        if (onMobileSelectNote) onMobileSelectNote();
                      }}
                      className={`group relative p-2.5 rounded-xl cursor-pointer mac-transition text-left border ${
                        isActive
                          ? 'bg-blue-600/10 border-blue-500/40 shadow-xs'
                          : 'border-transparent hover:bg-[var(--bg-control-hover)]'
                      }`}
                      style={{
                        backgroundColor: isActive ? undefined : 'var(--bg-card)'
                      }}
                    >
                      <div className="flex items-start justify-between gap-1 mb-1">
                        <span
                          className="font-semibold text-xs truncate flex-1 tracking-tight"
                          style={{
                            color: isActive ? 'var(--accent-mac)' : 'var(--text-primary)'
                          }}
                        >
                          {n.title || 'Untitled Note'}
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                          {n.is_pinned && <Pin className="w-3 h-3 text-blue-500 fill-blue-500/20" />}
                          {n.is_favorite && <Star className="w-3 h-3 text-amber-500 fill-amber-500" />}
                          <span className="text-[9px] font-mono" style={{ color: 'var(--text-muted)' }}>
                            {formatCardDate(n.updated_at)}
                          </span>
                        </div>
                      </div>

                      <p className="text-[11px] line-clamp-2 mb-2 leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
                        {n.content || (n.generated_code ? `[Generated ${n.language} code]` : 'Empty note')}
                      </p>

                      <div className="flex items-center gap-1.5 text-[9px]">
                        {n.category_name && (
                          <span
                            className="px-1.5 py-0.2 rounded-md font-medium truncate max-w-[95px] uppercase tracking-wider"
                            style={{
                              backgroundColor: `${n.category_color}18`,
                              color: n.category_color,
                              border: `1px solid ${n.category_color}30`
                            }}
                          >
                            {n.category_name}
                          </span>
                        )}
                        {n.generated_code && (
                          <span className="flex items-center gap-0.5 px-1.5 py-0.2 rounded-md bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 font-mono border border-indigo-500/25">
                            <Code className="w-2.5 h-2.5" />
                            {n.language}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Preferences Action */}
      <div className="p-2 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
        <button
          onClick={onOpenSettings}
          title="Settings & Local AI Models"
          className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg mac-btn transition text-xs hover:bg-[var(--bg-control-hover)]"
          style={{ color: 'var(--text-secondary)' }}
        >
          <SettingsIcon className="w-3.5 h-3.5" style={{ color: 'var(--text-secondary)' }} />
          {!collapsed && <span>Settings & Models</span>}
        </button>
      </div>
    </aside>
  );
};

