import React from 'react';
import { Database, Cpu, Mic, ShieldCheck, Check, Sparkles, HardDrive } from 'lucide-react';
import { SystemStatus, SaveStatus } from '../types';

interface StatusBarProps {
  systemStatus: SystemStatus | null;
  saveStatus: SaveStatus;
  wordCount: number;
  charCount: number;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  systemStatus,
  saveStatus,
  wordCount,
  charCount
}) => {
  const isAIRdy = systemStatus?.ollama_status === 'ready';

  return (
    <footer
      className="h-6 px-3.5 flex items-center justify-between text-[11px] select-none mac-acrylic border-t z-30 relative"
      style={{
        backgroundColor: 'var(--bg-header)',
        borderColor: 'var(--border-subtle)',
        color: 'var(--text-muted)'
      }}
    >
      {/* Left System Badges */}
      <div className="flex items-center gap-3.5">
        {/* Offline AI Status */}
        <div className="flex items-center gap-1.5 cursor-default" title="Local Language Model Status">
          <span className={`w-1.5 h-1.5 rounded-full ${isAIRdy ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]' : 'bg-amber-500'}`} />
          <span className="font-mono text-[10px] tracking-tight" style={{ color: 'var(--text-secondary)' }}>
            {isAIRdy
              ? `AI: ${systemStatus?.active_coding_model || 'Ready'}`
              : 'AI: Standby'}
          </span>
        </div>

        {/* Database Status */}
        <div className="flex items-center gap-1.5 font-mono text-[10px]" title="SQLite FTS5 Full-Text Search Active" style={{ color: 'var(--text-secondary)' }}>
          <Database className="w-3 h-3 text-blue-500" />
          <span>SQLite FTS5</span>
        </div>

        {/* Local Embedding Status */}
        <div className="hidden sm:flex items-center gap-1.5 font-mono text-[10px]" title="Local Nomic Vector Embeddings Active" style={{ color: 'var(--text-secondary)' }}>
          <Cpu className="w-3 h-3 text-indigo-500" />
          <span>Vector Index</span>
        </div>

        {/* Privacy Offline Guarantee */}
        <div className="flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400" title="Zero remote servers — running 100% on local hardware">
          <ShieldCheck className="w-3 h-3" />
          <span className="text-[10px]">100% Private Offline</span>
        </div>
      </div>

      {/* Right Stats and Save Status */}
      <div className="flex items-center gap-2.5 text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
        <span>{wordCount} words</span>
        <span>/</span>
        <span>{charCount} chars</span>
        <span>•</span>
        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
          <Check className="w-3 h-3" />
          <span className="font-sans font-medium">Local DB Synced</span>
        </span>
        <span className="hidden sm:inline">v1.0.0</span>
      </div>
    </footer>
  );
};

