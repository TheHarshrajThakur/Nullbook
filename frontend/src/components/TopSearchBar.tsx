import React, { useState, useEffect, useRef } from 'react';
import {
  Search, Mic, Moon, Sun, X, Sparkles, Filter, Code, FileText,
  Command, CornerDownLeft, ArrowRight, ShieldCheck, Zap, Menu
} from 'lucide-react';
import { SearchResultItem, Theme } from '../types';
import { api } from '../services/api';

interface TopSearchBarProps {
  onSelectResult: (noteId: string) => void;
  onOpenVoice: () => void;
  theme: Theme;
  onToggleTheme: () => void;
  offlineStatus: string;
  onOpenMobileNotes?: () => void;
}

export const TopSearchBar: React.FC<TopSearchBarProps> = ({
  onSelectResult,
  onOpenVoice,
  theme,
  onToggleTheme,
  offlineStatus,
  onOpenMobileNotes
}) => {
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState<'all' | 'keyword' | 'semantic'>('all');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [isSpotlightOpen, setIsSpotlightOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounced search query
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.searchNotes({
          query: query.trim(),
          search_type: searchType,
          limit: 10
        });
        setResults(res.items);
        setSelectedIndex(0);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 180);

    return () => clearTimeout(timer);
  }, [query, searchType]);

  // Global hotkey Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSpotlightOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
      if (e.key === 'Escape' && isSpotlightOpen) {
        setIsSpotlightOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSpotlightOpen]);

  // Keyboard navigation for Spotlight results
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === 'Enter' && results.length > 0) {
      e.preventDefault();
      const chosen = results[selectedIndex];
      if (chosen) {
        onSelectResult(chosen.id);
        setIsSpotlightOpen(false);
        setQuery('');
      }
    }
  };

  return (
    <>
      {/* macOS Frosted Titlebar */}
      <header
        className="h-11 border-b flex items-center justify-between px-2.5 sm:px-3.5 select-none mac-acrylic z-30 relative mac-inset-highlight"
        style={{
          backgroundColor: 'var(--bg-header)',
          borderColor: 'var(--border-subtle)'
        }}
      >
        {/* Left: Mobile Menu + App Brand */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Mobile Menu Button to open Notes */}
          {onOpenMobileNotes && (
            <button
              onClick={onOpenMobileNotes}
              title="Open Notes List"
              className="lg:hidden p-1.5 rounded-lg text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-[var(--bg-control-hover)] transition"
            >
              <Menu className="w-4 h-4" />
            </button>
          )}

          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="text-xs font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Nullbook
            </span>
            <span className="text-[9px] sm:text-[10px] px-1.5 py-0.2 sm:py-0.5 rounded-full font-medium tracking-wide bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/25">
              AI
            </span>
          </div>
        </div>

        {/* Center: macOS Spotlight Trigger Pill */}
        <div className="flex-1 max-w-md mx-2 sm:mx-4">
          <button
            onClick={() => {
              setIsSpotlightOpen(true);
              setTimeout(() => inputRef.current?.focus(), 50);
            }}
            className="w-full flex items-center justify-between px-2.5 sm:px-3 py-1.5 rounded-xl border mac-transition hover:border-blue-500/50 hover:bg-[var(--bg-control-hover)] text-left group shadow-xs cursor-text"
            style={{
              backgroundColor: 'var(--bg-control)',
              borderColor: 'var(--border-card)'
            }}
          >
            <div className="flex items-center gap-1.5 sm:gap-2 text-xs min-w-0" style={{ color: 'var(--text-muted)' }}>
              <Search className="w-3.5 h-3.5 group-hover:text-blue-500 shrink-0 mac-transition" style={{ color: 'var(--text-tertiary)' }} />
              <span className="truncate hidden sm:inline">Search notes, code, tags, or concepts...</span>
              <span className="truncate sm:hidden">Search notes...</span>
            </div>
          </button>
        </div>

        {/* Right: Quick Actions & Status */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Voice Dictation Button */}
          <button
            onClick={onOpenVoice}
            title="Voice Dictation & Quick Commands"
            className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg border mac-btn text-xs font-medium shadow-xs hover:border-red-500/40 hover:bg-red-500/10 active:scale-95 transition"
            style={{
              backgroundColor: 'var(--bg-control)',
              borderColor: 'var(--border-card)',
              color: 'var(--text-secondary)'
            }}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            <span className="text-[11px] font-medium hidden sm:inline">Voice</span>
          </button>

          {/* AI Status Pill (Desktop only) */}
          <div
            className="hidden md:flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[11px] font-medium"
            style={{
              backgroundColor: 'var(--bg-control)',
              borderColor: 'var(--border-subtle)'
            }}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${offlineStatus === 'ready' ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-amber-400'}`} />
            <span className="text-[11px] font-mono tracking-tight" style={{ color: 'var(--text-secondary)' }}>
              {offlineStatus === 'ready' ? 'AI Ready' : 'Standby'}
            </span>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={onToggleTheme}
            title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            className="p-1.5 rounded-lg mac-btn transition hover:bg-[var(--bg-control-hover)]"
            style={{ color: 'var(--text-secondary)' }}
          >
            {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-300" /> : <Moon className="w-3.5 h-3.5 text-blue-500" />}
          </button>
        </div>
      </header>

      {/* macOS Spotlight Modal Overlay */}
      {isSpotlightOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-10 sm:pt-20 px-3 sm:px-4 bg-black/60 backdrop-blur-md transition-all duration-150 animate-in fade-in"
          onClick={() => setIsSpotlightOpen(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="w-full max-w-2xl rounded-2xl border mac-acrylic mac-window-shadow overflow-hidden flex flex-col text-left mac-inset-highlight animate-in zoom-in-95 duration-150 max-h-[85vh]"
            style={{
              backgroundColor: 'var(--bg-surface-elevated)',
              borderColor: 'var(--border-card)'
            }}
          >
            {/* Spotlight Input Box */}
            <div className="flex items-center gap-2 sm:gap-3 px-3.5 sm:px-4 py-2.5 sm:py-3 border-b shrink-0" style={{ borderColor: 'var(--border-subtle)' }}>
              <Search className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search notes, code, functions, tags..."
                className="w-full bg-transparent text-sm outline-none font-medium"
                style={{
                  color: 'var(--text-primary)'
                }}
                autoFocus
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="p-1 rounded-md hover:bg-[var(--bg-control-hover)]"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              {/* Search Type Filter Pills */}
              <div className="mac-segmented shrink-0">
                {(['all', 'keyword', 'semantic'] as const).map(type => (
                  <button
                    key={type}
                    onClick={() => setSearchType(type)}
                    className={`text-[10px] px-2 py-0.5 rounded-md font-semibold uppercase tracking-wider transition ${
                      searchType === type
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'hover:text-blue-600'
                    }`}
                    style={{
                      color: searchType === type ? '#ffffff' : 'var(--text-secondary)'
                    }}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Results List */}
            <div className="max-h-[380px] overflow-y-auto divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
              {loading ? (
                <div className="p-8 text-center text-xs flex items-center justify-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  <span>Searching offline database & vector embeddings...</span>
                </div>
              ) : query && results.length === 0 ? (
                <div className="p-8 text-center text-xs" style={{ color: 'var(--text-secondary)' }}>
                  No matching notes or code found for <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>"{query}"</span>
                </div>
              ) : results.length > 0 ? (
                results.map((item, index) => {
                  const isSelected = index === selectedIndex;
                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        onSelectResult(item.id);
                        setIsSpotlightOpen(false);
                      }}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`p-3 cursor-pointer mac-transition flex items-start justify-between gap-3 ${
                        isSelected
                          ? 'bg-blue-600/10 border-l-2 border-blue-500 pl-3.5'
                          : 'hover:bg-[var(--bg-control-hover)]'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {item.note_type === 'code' ? (
                            <Code className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          ) : (
                            <FileText className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                          )}
                          <span className="font-semibold text-xs tracking-tight truncate" style={{ color: 'var(--text-primary)' }}>
                            {item.title}
                          </span>
                          <span
                            className="text-[9px] px-1.5 py-0.5 rounded-md font-medium uppercase tracking-wider shrink-0"
                            style={{
                              backgroundColor: `${item.category_color}20`,
                              color: item.category_color,
                              border: `1px solid ${item.category_color}35`
                            }}
                          >
                            {item.category_name}
                          </span>
                        </div>

                        <div
                          className="text-[11px] line-clamp-2 leading-relaxed font-normal"
                          style={{ color: 'var(--text-secondary)' }}
                          dangerouslySetInnerHTML={{ __html: item.snippet }}
                        />
                      </div>

                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span
                          className="text-[9px] px-1.5 py-0.5 rounded font-mono"
                          style={{ backgroundColor: 'var(--bg-control)', color: 'var(--text-muted)' }}
                        >
                          {item.match_type}
                        </span>
                        {isSelected && (
                          <div className="flex items-center gap-1 text-[10px] text-blue-500 font-medium">
                            <span>Open</span>
                            <CornerDownLeft className="w-3 h-3" />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-6 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
                  <div className="flex justify-center gap-4 text-[11px] mb-2" style={{ color: 'var(--text-secondary)' }}>
                    <span>↑↓ Navigate</span>
                    <span>•</span>
                    <span>↵ Select</span>
                    <span>•</span>
                    <span>Esc Close</span>
                  </div>
                  Type keywords, function names, or natural language prompts.
                </div>
              )}
            </div>

            {/* Spotlight Footer */}
            <div
              className="px-4 py-2 border-t flex items-center justify-between text-[10px]"
              style={{
                backgroundColor: 'var(--bg-control)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-muted)'
              }}
            >
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3 h-3 text-emerald-500" />
                <span>SQLite FTS5 + Local Nomic Vector Index</span>
              </div>
              <span>Press Esc to exit</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

