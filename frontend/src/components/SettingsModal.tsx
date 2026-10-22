import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, X, Server, Database, Save, CheckCircle2, AlertTriangle, RefreshCw, HardDrive, Cpu, ShieldCheck } from 'lucide-react';
import { SystemStatus } from '../types';
import { api } from '../services/api';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  systemStatus: SystemStatus | null;
  onRefreshStatus: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  systemStatus,
  onRefreshStatus
}) => {
  const [ollamaUrl, setOllamaUrl] = useState('http://127.0.0.1:11434');
  const [modelName, setModelName] = useState('qwen2.5-coder:1.5b');
  const [embedModel, setEmbedModel] = useState('nomic-embed-text');
  const [saving, setSaving] = useState(false);
  const [backupMsg, setBackupMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      api.getSettings().then(s => {
        if (s.ollama_url) setOllamaUrl(s.ollama_url);
        if (s.ollama_model) setModelName(s.ollama_model);
        if (s.embed_model) setEmbedModel(s.embed_model);
      }).catch(console.error);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      await api.saveSettings({
        ollama_url: ollamaUrl.trim(),
        ollama_model: modelName.trim(),
        embed_model: embedModel.trim()
      });
      onRefreshStatus();
      alert('Settings saved successfully!');
    } catch (e: any) {
      alert(e.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleBackup = async () => {
    try {
      const res = await api.createBackup();
      setBackupMsg(`Backup created successfully: ${res.backup_file}`);
    } catch (e: any) {
      alert(e.message || 'Backup failed');
    }
  };

  const isAIRdy = systemStatus?.ollama_status === 'ready';

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50 select-none animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="w-full max-w-xl rounded-2xl border mac-acrylic mac-window-shadow overflow-hidden text-left mac-inset-highlight animate-in zoom-in-95 duration-150"
        style={{
          backgroundColor: 'var(--bg-surface-elevated)',
          borderColor: 'var(--border-card)'
        }}
      >
        {/* macOS Sheet Header */}
        <div
          className="p-4 px-5 border-b flex items-center justify-between"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <SettingsIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white tracking-tight">Preferences & Offline AI</h3>
              <p className="text-[11px] text-gray-400">Configure local model runtimes, privacy & SQLite storage</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.08] mac-btn transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sheet Body */}
        <div className="p-4 sm:p-5 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
          {/* Status Diagnostic Card */}
          <div
            className="p-3.5 rounded-xl border space-y-2.5 bg-black/25"
            style={{ borderColor: 'var(--border-subtle)' }}
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white text-xs flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-blue-400" />
                <span>Local AI Engine Status</span>
              </span>
              <button
                onClick={onRefreshStatus}
                title="Refresh Status"
                className="p-1 rounded-md text-gray-400 hover:text-white hover:bg-white/[0.08] mac-btn transition"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5 text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${isAIRdy ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-amber-400'}`} />
                <span className="text-gray-300">
                  Ollama Daemon: <strong className={isAIRdy ? 'text-emerald-400' : 'text-amber-400'}>{systemStatus?.ollama_status || 'Checking...'}</strong>
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-gray-300">
                  Database: <strong className="text-emerald-400">SQLite + FTS5 Ready</strong>
                </span>
              </div>
              <div className="col-span-2 text-[10px] text-gray-400 font-mono bg-white/[0.03] p-2 rounded-lg border border-white/[0.06]">
                Loaded Models: {systemStatus?.ollama_models?.length ? systemStatus.ollama_models.join(', ') : 'None detected locally'}
              </div>
            </div>
          </div>

          {/* Local Model Runtime Settings */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-white flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-blue-400" />
              <span>Ollama Daemon Endpoints</span>
            </h4>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-gray-300">Ollama API Base URL:</label>
              <input
                type="text"
                value={ollamaUrl}
                onChange={e => setOllamaUrl(e.target.value)}
                placeholder="http://127.0.0.1:11434"
                className="w-full bg-black/30 border rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-blue-500/60 font-mono transition"
                style={{ borderColor: 'var(--border-card)' }}
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-gray-300">Coding Language Model:</label>
              <input
                type="text"
                value={modelName}
                onChange={e => setModelName(e.target.value)}
                placeholder="qwen2.5-coder:1.5b"
                className="w-full bg-black/30 border rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-blue-500/60 font-mono transition"
                style={{ borderColor: 'var(--border-card)' }}
              />
              <p className="text-[10px] text-gray-500">
                Default: <code>qwen2.5-coder:1.5b</code>. Runs fully private with no internet required.
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-gray-300">Semantic Vector Model:</label>
              <input
                type="text"
                value={embedModel}
                onChange={e => setEmbedModel(e.target.value)}
                placeholder="nomic-embed-text"
                className="w-full bg-black/30 border rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-blue-500/60 font-mono transition"
                style={{ borderColor: 'var(--border-card)' }}
              />
            </div>
          </div>

          {/* Database Backup & Maintenance */}
          <div className="space-y-2 pt-2 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
            <h4 className="text-xs font-semibold text-white flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-blue-400" />
              <span>Offline Database Backup</span>
            </h4>
            <div className="flex items-center gap-2">
              <button
                onClick={handleBackup}
                className="px-3.5 py-1.5 bg-white/[0.06] hover:bg-white/[0.1] text-gray-200 rounded-xl text-xs font-medium border mac-btn transition"
                style={{ borderColor: 'var(--border-card)' }}
              >
                Create SQLite Backup Now
              </button>
            </div>
            {backupMsg && <p className="text-[11px] text-emerald-400 font-mono">{backupMsg}</p>}
          </div>
        </div>

        {/* Sheet Footer */}
        <div
          className="p-3 px-5 border-t flex justify-end gap-2.5 bg-black/25"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-medium text-gray-300 hover:text-white mac-btn transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveSettings}
            disabled={saving}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-xs mac-btn transition active:scale-95"
          >
            {saving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </div>
    </div>
  );
};

