import React, { useState, useEffect, useRef } from 'react';
import {
  Search, Mic, Moon, Sun, X, Sparkles, Filter, Code, FileText,
  Command, CornerDownLeft, ArrowRight, ShieldCheck, Zap
} from 'lucide-react';
import { SearchResultItem, Theme } from '../types';
import { api } from '../services/api';

interface TopSearchBarProps {
  onSelectResult: (noteId: string) => void;
  onOpenVoice: () => void;
  theme: Theme;
  onToggleTheme: () => void;
  offlineStatus: string;
}

export const TopSearchBar: React.FC<TopSearchBarProps> = ({
  onSelectResult,
  onOpenVoice,
  theme,
  onToggleTheme,
  offlineStatus
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
        className="h-11 border-b flex items-center justify-between px-3.5 select-none mac-acrylic z-30 relative mac-inset-highlight"
        style={{
          backgroundColor: 'var(--bg-header)',
          borderColor: 'var(--border-subtle)'
        }}
      >
        {/* Left: macOS Traffic Lights + App Brand */}
        <div className="flex items-center gap-3">
          {/* Traffic lights */}
          <div className="flex items-center gap-2 group cursor-pointer mr-1">
            <div className="w-3 h-3 rounded-full bg-[#ff5f57] border border-[#e0443e] shadow-sm flex items-center justify-center text-[8px] font-bold text-[#4c0000] opacity-90 group-hover:opacity-100 transition">
              <span className="opacity-0 group-hover:opacity-100 leading-none">×</span>
            </div>
            <div className="w-3 h-3 rounded-full bg-[#febc2e] border border-[#d89e24] shadow-sm flex items-center justify-center text-[8px] font-bold text-[#5c3c00] opacity-90 group-hover:opacity-100 transition">
              <span className="opacity-0 group-hover:opacity-100 leading-none">-</span>
            </div>
            <div className="w-3 h-3 rounded-full bg-[#28c840] border border-[#1aab29] shadow-sm flex items-center justify-center text-[8px] font-bold text-[#004d00] opacity-90 group-hover:opacity-100 transition">
              <span className="opacity-0 group-hover:opacity-100 leading-none">+</span>
            </div>
          </div>

          <div className="flex items-center gap-2 pl-1 border-l" style={{ borderColor: 'var(--border-subtle)' }}>
            <span className="text-xs font-semibold tracking-tight text-white/90">
              IntelliNote
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium tracking-wide bg-blue-500/15 text-blue-400 border border-blue-500/25">
              PRO
            </span>
          </div>
        </div>

        {/* Center: macOS Spotlight Trigger Pill */}
        <div className="flex-1 max-w-md mx-4">
          <button
            onClick={() => {
              setIsSpotlightOpen(true);
              setTimeout(() => inputRef.current?.focus(), 50);
            }}
            className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl border mac-transition hover:border-blue-500/50 hover:bg-white/[0.04] text-left group shadow-xs cursor-text"
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.22)',
              borderColor: 'var(--border-card)'
            }}
          >
            <div className="flex items-center gap-2 text-xs text-gray-400 group-hover:text-gray-300">
              <Search className="w-3.5 h-3.5 text-gray-400 group-hover:text-blue-400 mac-transition" />
              <span className="truncate">Search notes, code, tags, or concepts...</span>
            </div>
          </button>
        </div>

        {/* Right: Quick Actions & Status */}
        <div className="flex items-center gap-2">
          {/* Voice Dictation Button */}
          <button
            onClick={onOpenVoice}
            title="Offline Voice Dictation & Quick Commands"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border mac-btn text-xs font-medium text-gray-200 shadow-xs hover:border-red-500/40 hover:bg-red-500/10 active:scale-95 transition"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              borderColor: 'var(--border-card)'
            }}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            <span className="text-[11px] font-medium">Voice</span>
          </button>

          {/* Offline AI Status Pill */}
          <div
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[11px] font-medium"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              borderColor: 'var(--border-subtle)'
            }}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${offlineStatus === 'ready' ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-amber-400'}`} />
            <span className="text-[11px] text-gray-300 font-mono tracking-tight">
              {offlineStatus === 'ready' ? 'Ollama Ready' : 'Standby'}
            </span>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={onToggleTheme}
            title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.06] mac-btn transition"
          >
            {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-300" /> : <Moon className="w-3.5 h-3.5 text-blue-500" />}
          </button>
        </div>
      </header>

      {/* macOS Spotlight Modal Overlay */}
      {isSpotlightOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-black/55 backdrop-blur-md transition-all duration-150 animate-in fade-in"
          onClick={() => setIsSpotlightOpen(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="w-full max-w-2xl rounded-2xl border mac-acrylic mac-window-shadow overflow-hidden flex flex-col text-left mac-inset-highlight animate-in zoom-in-95 duration-150"
            style={{
              backgroundColor: 'var(--bg-surface-elevated)',
              borderColor: 'var(--border-card)'
            }}
          >
            {/* Spotlight Input Box */}
            <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
              <Search className="w-5 h-5 text-blue-400 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Spotlight Search: type notes, code, functions, tags..."
                className="w-full bg-transparent text-sm text-white placeholder-gray-400 outline-none font-medium"
                autoFocus
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="p-1 rounded-md text-gray-400 hover:text-white hover:bg-white/[0.08]"
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
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Results List */}
            <div className="max-h-[380px] overflow-y-auto divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
              {loading ? (
                <div className="p-8 text-center text-xs text-gray-400 flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                  <span>Searching offline database & vector embeddings...</span>
                </div>
              ) : query && results.length === 0 ? (
                <div className="p-8 text-center text-xs text-gray-400">
                  No matching notes or code found for <span className="text-gray-200">"{query}"</span>
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
                          ? 'bg-blue-600/20 text-white border-l-2 border-blue-500 pl-3.5'
                          : 'hover:bg-white/[0.03] text-gray-200'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {item.note_type === 'code' ? (
                            <Code className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                          ) : (
                            <FileText className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                          )}
                          <span className="font-semibold text-xs tracking-tight truncate">
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
                          className="text-[11px] text-gray-300 line-clamp-2 leading-relaxed font-normal"
                          dangerouslySetInnerHTML={{ __html: item.snippet }}
                        />
                      </div>

                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/[0.06] text-gray-400 font-mono">
                          {item.match_type}
                        </span>
                        {isSelected && (
                          <div className="flex items-center gap-1 text-[10px] text-blue-400 font-medium">
                            <span>Open</span>
                            <CornerDownLeft className="w-3 h-3" />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-6 text-center text-xs text-gray-500">
                  <div className="flex justify-center gap-4 text-[11px] text-gray-400 mb-2">
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
              className="px-4 py-2 border-t flex items-center justify-between text-[10px] text-gray-400"
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.25)',
                borderColor: 'var(--border-subtle)'
              }}
            >
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
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

