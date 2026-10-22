import React, { useState } from 'react';
import {
  Code, Play, Copy, Check, Download, History, RefreshCw,
  CheckCircle2, XCircle, AlertTriangle, HelpCircle, Terminal,
  ChevronDown, ChevronUp, FileCode, Edit3, Sparkles, Zap, ShieldAlert
} from 'lucide-react';
import { Note, ValidationResult, ExecutionResult } from '../types';
import { api } from '../services/api';

interface CodePanelProps {
  note: Note | null;
  onUpdateCode: (code: string, language: string, explanation?: string) => void;
  onGenerateCode: () => void;
  isGenerating: boolean;
  onOpenRevisions: () => void;
}

const SUPPORTED_LANGUAGES = [
  { id: 'python', name: 'Python', ext: 'py', icon: '🐍' },
  { id: 'javascript', name: 'JavaScript', ext: 'js', icon: '⚡' },
  { id: 'java', name: 'Java', ext: 'java', icon: '☕' },
  { id: 'c', name: 'C', ext: 'c', icon: '⚙️' },
  { id: 'cpp', name: 'C++', ext: 'cpp', icon: '🚀' },
];

export const CodePanel: React.FC<CodePanelProps> = ({
  note,
  onUpdateCode,
  onGenerateCode,
  isGenerating,
  onOpenRevisions
}) => {
  const [copied, setCopied] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [executing, setExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [showTerminal, setShowTerminal] = useState(false);
  const [showExplanation, setShowExplanation] = useState(true);

  if (!note) return null;

  const currentLang = note.language || 'python';

  const handleCopy = () => {
    if (!note.generated_code) return;
    navigator.clipboard.writeText(note.generated_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleValidate = async () => {
    if (!note.generated_code) return;
    setValidating(true);
    try {
      const res = await api.validateCode(note.generated_code, currentLang);
      setValidationResult(res);
    } catch (e: any) {
      setValidationResult({
        status: 'syntax_check_failed',
        message: e.message || 'Validation failed'
      });
    } finally {
      setValidating(false);
    }
  };

  const handleExecute = async () => {
    if (!note.generated_code) return;
    setExecuting(true);
    setShowTerminal(true);
    try {
      const res = await api.executeCode(note.generated_code, currentLang);
      setExecutionResult(res);
    } catch (e: any) {
      setExecutionResult({
        stdout: '',
        stderr: e.message || 'Execution error',
        exit_code: -1,
        execution_time_ms: 0,
        timed_out: false,
        memory_exceeded: false
      });
    } finally {
      setExecuting(false);
    }
  };

  const handleExport = (format: string) => {
    const url = api.getExportUrl(note.id, format);
    window.open(url, '_blank');
  };

  const renderValidationBadge = () => {
    const status = validationResult ? validationResult.status : note.validation_status;

    switch (status) {
      case 'syntax_check_passed':
        return (
          <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25">
            <CheckCircle2 className="w-3 h-3" />
            <span>Syntax Valid</span>
          </div>
        );
      case 'syntax_check_failed':
        return (
          <div className="flex items-center gap-1.5 text-[10px] text-red-400 font-semibold px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/25">
            <XCircle className="w-3 h-3" />
            <span>Syntax Error</span>
          </div>
        );
      case 'validation_unavailable':
        return (
          <div className="flex items-center gap-1.5 text-[10px] text-amber-400 font-medium px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/25">
            <AlertTriangle className="w-3 h-3" />
            <span>AST Unavailable</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1.5 text-[10px] text-gray-400 px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.08]">
            <HelpCircle className="w-3 h-3 text-gray-500" />
            <span>Not Validated</span>
          </div>
        );
    }
  };

  // Split code into lines for editor display
  const codeLines = (note.generated_code || '').split('\n');

  return (
    <div
      className="w-1/2 flex flex-col h-full overflow-hidden select-none relative z-10"
      style={{
        backgroundColor: '#070a11',
        borderLeft: '1px solid var(--border-subtle)'
      }}
    >
      {/* Top Controls Bar */}
      <div
        className="h-11 px-4 border-b flex items-center justify-between gap-2 mac-acrylic z-10"
        style={{
          backgroundColor: 'var(--bg-header)',
          borderColor: 'var(--border-subtle)'
        }}
      >
        {/* Language Selector */}
        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border mac-transition"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              borderColor: 'var(--border-card)'
            }}
          >
            <span className="text-xs">
              {SUPPORTED_LANGUAGES.find(l => l.id === currentLang)?.icon || '💻'}
            </span>
            <select
              value={currentLang}
              onChange={e => onUpdateCode(note.generated_code, e.target.value)}
              className="bg-transparent text-gray-200 text-xs font-semibold outline-none cursor-pointer pr-1"
            >
              {SUPPORTED_LANGUAGES.map(lang => (
                <option key={lang.id} value={lang.id} className="bg-[#0f172a] text-gray-200">
                  {lang.name} (.{lang.ext})
                </option>
              ))}
            </select>
          </div>

          {/* Validation Status Badge */}
          {renderValidationBadge()}
        </div>

        {/* Right Actions Bar */}
        <div className="flex items-center gap-1.5">
          {/* Revisions History Button */}
          <button
            onClick={onOpenRevisions}
            title="View Code Revision History"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-white/[0.06] text-gray-300 hover:text-white text-xs font-medium border mac-btn transition"
            style={{ borderColor: 'var(--border-card)' }}
          >
            <History className="w-3.5 h-3.5 text-blue-400" />
            <span>Revisions</span>
            <span className="text-[10px] px-1 rounded bg-blue-500/20 text-blue-300 font-mono">
              {note.revisions_count || 0}
            </span>
          </button>

          {/* Copy Button */}
          <button
            onClick={handleCopy}
            disabled={!note.generated_code}
            title="Copy Code to Clipboard"
            className="p-1.5 rounded-lg hover:bg-white/[0.06] text-gray-300 hover:text-white mac-btn transition disabled:opacity-30"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>

          {/* Export Dropdown */}
          <div className="relative group">
            <button
              disabled={!note.generated_code}
              title="Export Source File"
              className="p-1.5 rounded-lg hover:bg-white/[0.06] text-gray-300 hover:text-white mac-btn transition disabled:opacity-30"
            >
              <Download className="w-4 h-4" />
            </button>
            <div
              className="absolute right-0 top-full mt-1.5 hidden group-hover:block border rounded-xl shadow-2xl p-1 z-50 min-w-[140px] mac-acrylic"
              style={{
                backgroundColor: 'var(--bg-surface-elevated)',
                borderColor: 'var(--border-card)'
              }}
            >
              <button
                onClick={() => handleExport(SUPPORTED_LANGUAGES.find(l => l.id === currentLang)?.ext || 'txt')}
                className="w-full text-left px-3 py-1.5 text-xs text-gray-200 hover:bg-blue-600 rounded-lg transition font-medium"
              >
                .{SUPPORTED_LANGUAGES.find(l => l.id === currentLang)?.ext || 'txt'} File
              </button>
              <button
                onClick={() => handleExport('md')}
                className="w-full text-left px-3 py-1.5 text-xs text-gray-200 hover:bg-blue-600 rounded-lg transition font-medium"
              >
                Markdown (.md)
              </button>
              <button
                onClick={() => handleExport('txt')}
                className="w-full text-left px-3 py-1.5 text-xs text-gray-200 hover:bg-blue-600 rounded-lg transition font-medium"
              >
                Plain Text (.txt)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Editor Main Canvas (Dark IDE Background) */}
      <div className="flex-1 flex flex-col min-h-0 bg-[#05080f] relative overflow-hidden">
        {note.generated_code ? (
          <div className="flex-1 flex overflow-hidden">
            {/* Line Numbers */}
            <div className="w-12 py-3 pr-3 text-right text-xs text-gray-600 font-mono select-none border-r border-white/[0.05] bg-[#04060c]">
              {codeLines.map((_, i) => (
                <div key={i} className="leading-6">{i + 1}</div>
              ))}
            </div>

            {/* Code Content Textarea */}
            <div className="flex-1 overflow-auto p-3.5">
              <textarea
                value={note.generated_code}
                onChange={e => onUpdateCode(e.target.value, currentLang)}
                spellCheck={false}
                className="w-full h-full bg-transparent text-xs text-blue-50 font-mono leading-6 outline-none resize-none code-font whitespace-pre selection:bg-blue-600/35"
              />
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-400">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-3 shadow-sm">
              <FileCode className="w-7 h-7" />
            </div>
            <p className="text-sm font-semibold text-white tracking-tight mb-1">No Code Generated Yet</p>
            <p className="text-xs text-gray-400 max-w-xs mb-4 leading-relaxed">
              Draft your requirements in the writing canvas and let Ollama convert it to working {currentLang.toUpperCase()} code.
            </p>
            <button
              onClick={onGenerateCode}
              disabled={isGenerating || !note.content.trim()}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-semibold shadow-xs mac-btn transition active:scale-95"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>Generate Now</span>
            </button>
          </div>
        )}
      </div>

      {/* Validation Error Details Bar */}
      {validationResult && validationResult.status === 'syntax_check_failed' && (
        <div className="p-3 border-t bg-red-950/40 border-red-500/30 text-xs text-red-200">
          <div className="flex items-center gap-1.5 font-semibold text-red-400 mb-1">
            <XCircle className="w-4 h-4 shrink-0" />
            <span>Syntax Error Detected:</span>
          </div>
          <p className="font-mono text-[11px] bg-black/40 p-2 rounded-lg border border-red-500/20">{validationResult.message}</p>
        </div>
      )}

      {/* Solution Explanation Accordion Drawer */}
      {note.explanation && (
        <div
          className="border-t text-xs max-h-36 overflow-y-auto mac-acrylic"
          style={{
            backgroundColor: 'var(--bg-surface-elevated)',
            borderColor: 'var(--border-subtle)'
          }}
        >
          <div
            onClick={() => setShowExplanation(!showExplanation)}
            className="p-2.5 px-3 flex items-center justify-between text-gray-300 hover:text-white cursor-pointer font-medium select-none"
          >
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span className="font-semibold text-xs tracking-tight">AI Solution Architecture & Explanation</span>
            </div>
            {showExplanation ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </div>
          {showExplanation && (
            <div className="px-3.5 pb-3 text-gray-300 text-[11px] leading-relaxed whitespace-pre-wrap font-sans">
              {note.explanation}
            </div>
          )}
        </div>
      )}

      {/* macOS Terminal Drawer for Safe Execution */}
      {showTerminal && (
        <div
          className="border-t font-mono text-xs max-h-52 overflow-y-auto shadow-2xl relative"
          style={{
            backgroundColor: '#0a0d14',
            borderColor: 'var(--border-subtle)'
          }}
        >
          {/* macOS Terminal Header with Traffic Lights */}
          <div
            className="p-2 px-3 border-b flex items-center justify-between text-[11px] text-gray-400 select-none sticky top-0 bg-[#0d111a]"
            style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }}
          >
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
              </div>
              <span className="text-[10px] font-semibold text-gray-300 ml-1">Terminal — Isolated Sandbox</span>
            </div>

            {executionResult && (
              <div className="flex items-center gap-2 text-[10px]">
                <span className={`px-1.5 py-0.2 rounded font-mono ${executionResult.exit_code === 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                  Exit: {executionResult.exit_code}
                </span>
                <span className="text-gray-400 font-mono">
                  {executionResult.execution_time_ms}ms
                </span>
              </div>
            )}

            <button
              onClick={() => setShowTerminal(false)}
              className="p-1 rounded hover:bg-white/[0.08] text-gray-400 hover:text-white transition"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Terminal Console Output */}
          <div className="p-3 text-[11px] font-mono space-y-1.5 bg-[#070a10]">
            <div className="text-gray-500 text-[10px]">
              ➜ sandbox-env/{currentLang} execution:
            </div>
            {executing ? (
              <div className="flex items-center gap-2 text-blue-400 animate-pulse">
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span>Running code safely in restricted process sandbox...</span>
              </div>
            ) : executionResult ? (
              <>
                {executionResult.stdout && (
                  <pre className="text-emerald-300 whitespace-pre-wrap font-mono leading-relaxed">{executionResult.stdout}</pre>
                )}
                {executionResult.stderr && (
                  <pre className="text-red-400 whitespace-pre-wrap font-mono leading-relaxed">{executionResult.stderr}</pre>
                )}
                {!executionResult.stdout && !executionResult.stderr && (
                  <p className="text-gray-500 italic">[Process completed with exit code 0 and no standard output]</p>
                )}
              </>
            ) : null}
          </div>
        </div>
      )}

      {/* Footer Validation & Run Actions */}
      <div
        className="h-11 px-4 border-t flex items-center justify-between mac-acrylic z-10"
        style={{
          backgroundColor: 'var(--bg-header)',
          borderColor: 'var(--border-subtle)'
        }}
      >
        <div className="flex items-center gap-2">
          {/* Validate Syntax Button */}
          <button
            onClick={handleValidate}
            disabled={validating || !note.generated_code}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] disabled:opacity-40 text-gray-200 text-xs font-semibold border mac-btn transition"
            style={{ borderColor: 'var(--border-card)' }}
          >
            <CheckCircle2 className={`w-3.5 h-3.5 ${validating ? 'animate-spin text-blue-400' : 'text-blue-400'}`} />
            <span>Validate Syntax</span>
          </button>

          {/* Run Code Button */}
          <button
            onClick={handleExecute}
            disabled={executing || !note.generated_code}
            title="Execute safely in sandbox"
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs mac-btn transition active:scale-95 disabled:opacity-40"
          >
            <Play className={`w-3 h-3 ${executing ? 'animate-spin' : 'fill-white'}`} />
            <span>Run Code</span>
          </button>
        </div>

        {/* Regenerate Action */}
        <button
          onClick={onGenerateCode}
          disabled={isGenerating || !note.content.trim()}
          title="Regenerate code"
          className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-xs font-semibold border border-blue-500/30 mac-btn transition disabled:opacity-40"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
          <span>Regenerate</span>
        </button>
      </div>
    </div>
  );
};

