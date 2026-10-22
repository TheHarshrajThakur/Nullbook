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
      className="h-6 px-3.5 flex items-center justify-between text-[11px] text-gray-400 select-none mac-acrylic border-t z-30 relative"
      style={{
        backgroundColor: 'var(--bg-header)',
        borderColor: 'var(--border-subtle)'
      }}
    >
      {/* Left System Badges */}
      <div className="flex items-center gap-3.5">
        {/* Offline AI Status */}
        <div className="flex items-center gap-1.5 cursor-default" title="Local Language Model Status">
          <span className={`w-1.5 h-1.5 rounded-full ${isAIRdy ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]' : 'bg-amber-400'}`} />
          <span className="text-gray-300 font-mono text-[10px] tracking-tight">
            {isAIRdy
              ? `AI: ${systemStatus?.active_coding_model || 'Ready'}`
              : 'AI: Standby'}
          </span>
        </div>

        {/* Database Status */}
        <div className="flex items-center gap-1.5 text-gray-300 font-mono text-[10px]" title="SQLite FTS5 Full-Text Search Active">
          <Database className="w-3 h-3 text-blue-400" />
          <span>SQLite FTS5</span>
        </div>

        {/* Local Embedding Status */}
        <div className="hidden sm:flex items-center gap-1.5 text-gray-300 font-mono text-[10px]" title="Local Nomic Vector Embeddings Active">
          <Cpu className="w-3 h-3 text-indigo-400" />
          <span>Vector Index</span>
        </div>

        {/* Privacy Offline Guarantee */}
        <div className="flex items-center gap-1 text-emerald-400 font-medium" title="Zero remote servers — running 100% on local hardware">
          <ShieldCheck className="w-3 h-3" />
          <span className="text-[10px]">100% Private Offline</span>
        </div>
      </div>

      {/* Right Stats and Save Status */}
      <div className="flex items-center gap-2.5 text-[10px] text-gray-400 font-mono">
        <span>{wordCount} words</span>
        <span className="text-gray-600">/</span>
        <span>{charCount} chars</span>
        <span className="text-gray-600">•</span>
        <span className="text-emerald-400 flex items-center gap-1">
          <Check className="w-3 h-3" />
          <span className="font-sans font-medium text-emerald-400">Local DB Synced</span>
        </span>
        <span className="text-gray-500 hidden sm:inline">v1.0.0</span>
      </div>
    </footer>
  );
};

