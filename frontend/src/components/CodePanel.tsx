import React, { useState } from 'react';
import {
  Code, Play, Copy, Check, Download, History, RefreshCw,
  CheckCircle2, XCircle, AlertTriangle, HelpCircle, Terminal,
  ChevronDown, ChevronUp, FileCode, Edit3, Sparkles, Zap, ShieldAlert
} from 'lucide-react';
import { Note, ValidationResult, ExecutionResult } from '../types';
import { api } from '../services/api';
import { PanelSplitter } from './PanelSplitter';

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
  const [terminalHeight, setTerminalHeight] = useState<number>(200);
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
      className="w-full flex flex-col h-full overflow-hidden select-none relative z-10"
      style={{
        backgroundColor: 'var(--bg-code)'
      }}
    >
      {/* Top Controls Bar */}
      <div
        className="h-11 px-2.5 sm:px-4 border-b flex items-center justify-between gap-1.5 sm:gap-2 mac-acrylic z-10 shrink-0"
        style={{
          backgroundColor: 'var(--bg-header)',
          borderColor: 'var(--border-subtle)'
        }}
      >
        {/* Language Selector */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div
            className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg border mac-transition"
            style={{
              backgroundColor: 'var(--bg-control)',
              borderColor: 'var(--border-card)'
            }}
          >
            <span className="text-xs">
              {SUPPORTED_LANGUAGES.find(l => l.id === currentLang)?.icon || '💻'}
            </span>
            <select
              value={currentLang}
              onChange={e => onUpdateCode(note.generated_code, e.target.value)}
              className="bg-transparent text-xs font-semibold outline-none cursor-pointer pr-1"
              style={{ color: 'var(--text-primary)' }}
            >
              {SUPPORTED_LANGUAGES.map(lang => (
                <option key={lang.id} value={lang.id} style={{ backgroundColor: 'var(--bg-surface-elevated)', color: 'var(--text-primary)' }}>
                  {lang.name} (.{lang.ext})
                </option>
              ))}
            </select>
          </div>

          {/* Validation Status Badge */}
          {renderValidationBadge()}
        </div>

        {/* Right Actions Bar */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Revisions History Button */}
          <button
            onClick={onOpenRevisions}
            title="View Code Revision History"
            className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg hover:bg-[var(--bg-control-hover)] text-xs font-medium border mac-btn transition"
            style={{ borderColor: 'var(--border-card)', color: 'var(--text-secondary)' }}
          >
            <History className="w-3.5 h-3.5 text-blue-500" />
            <span className="hidden sm:inline">Revisions</span>
            <span className="text-[10px] px-1 rounded bg-blue-500/15 text-blue-600 dark:text-blue-300 font-mono">
              {note.revisions_count || 0}
            </span>
          </button>

          {/* Copy Button */}
          <button
            onClick={handleCopy}
            disabled={!note.generated_code}
            title="Copy Code to Clipboard"
            className="p-1.5 rounded-lg hover:bg-[var(--bg-control-hover)] mac-btn transition disabled:opacity-30"
            style={{ color: 'var(--text-secondary)' }}
          >
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
          </button>

          {/* Export Dropdown */}
          <div className="relative group">
            <button
              disabled={!note.generated_code}
              title="Export Source File"
              className="p-1.5 rounded-lg hover:bg-[var(--bg-control-hover)] mac-btn transition disabled:opacity-30"
              style={{ color: 'var(--text-secondary)' }}
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
                className="w-full text-left px-3 py-1.5 text-xs hover:bg-blue-600 hover:text-white rounded-lg transition font-medium"
                style={{ color: 'var(--text-primary)' }}
              >
                .{SUPPORTED_LANGUAGES.find(l => l.id === currentLang)?.ext || 'txt'} File
              </button>
              <button
                onClick={() => handleExport('md')}
                className="w-full text-left px-3 py-1.5 text-xs hover:bg-blue-600 hover:text-white rounded-lg transition font-medium"
                style={{ color: 'var(--text-primary)' }}
              >
                Markdown (.md)
              </button>
              <button
                onClick={() => handleExport('txt')}
                className="w-full text-left px-3 py-1.5 text-xs hover:bg-blue-600 hover:text-white rounded-lg transition font-medium"
                style={{ color: 'var(--text-primary)' }}
              >
                Plain Text (.txt)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Editor Main Canvas (Dark or Light Theme Compatible) */}
      <div
        className="flex-1 flex flex-col min-h-0 relative overflow-hidden"
        style={{ backgroundColor: 'var(--bg-code-editor)' }}
      >
        {note.generated_code ? (
          <div className="flex-1 flex overflow-hidden">
            {/* Line Numbers */}
            <div
              className="w-12 py-3 pr-3 text-right text-xs font-mono select-none border-r"
              style={{
                backgroundColor: 'var(--bg-code-gutter)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-code-gutter)'
              }}
            >
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
                className="w-full h-full bg-transparent text-xs font-mono leading-6 outline-none resize-none code-font whitespace-pre selection:bg-blue-600/25"
                style={{ color: 'var(--text-code)' }}
              />
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center" style={{ color: 'var(--text-muted)' }}>
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500 mb-3 shadow-sm">
              <FileCode className="w-7 h-7" />
            </div>
            <p className="text-sm font-semibold tracking-tight mb-1" style={{ color: 'var(--text-primary)' }}>No Code Generated Yet</p>
            <p className="text-xs max-w-xs mb-4 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
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
            className="p-2.5 px-3 flex items-center justify-between cursor-pointer font-medium select-none hover:bg-[var(--bg-control-hover)]"
            style={{ color: 'var(--text-primary)' }}
          >
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-500" />
              <span className="font-semibold text-xs tracking-tight">AI Solution Architecture & Explanation</span>
            </div>
            {showExplanation ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </div>
          {showExplanation && (
            <div className="px-3.5 pb-3 text-[11px] leading-relaxed whitespace-pre-wrap font-sans" style={{ color: 'var(--text-secondary)' }}>
              {note.explanation}
            </div>
          )}
        </div>
      )}

      {/* Terminal Drawer for Safe Execution (Vertically Resizable) */}
      {showTerminal && (
        <div
          className="flex flex-col font-mono text-xs shadow-2xl relative shrink-0"
          style={{
            height: `${terminalHeight}px`,
            backgroundColor: '#0a0d14'
          }}
        >
          {/* Vertical Resize Splitter for Terminal */}
          <PanelSplitter
            direction="row"
            onDrag={({ deltaY }) => {
              setTerminalHeight(prev => Math.max(120, Math.min(prev - deltaY, 480)));
            }}
            onDoubleClick={() => setTerminalHeight(200)}
            title="Drag to resize terminal • Double click to reset"
          />

          {/* Terminal Drawer Header */}
          <div
            className="p-2 px-3 border-b flex items-center justify-between text-[11px] text-gray-400 select-none sticky top-0 bg-[#0d111a]"
            style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }}
          >
            <div className="flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-[10px] font-semibold text-gray-300">Terminal — Isolated Sandbox</span>
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
          <div className="flex-1 overflow-y-auto p-3 text-[11px] font-mono space-y-1.5 bg-[#070a10]">
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
        className="h-11 px-2.5 sm:px-4 border-t flex items-center justify-between mac-acrylic z-10 shrink-0"
        style={{
          backgroundColor: 'var(--bg-header)',
          borderColor: 'var(--border-subtle)'
        }}
      >
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Validate Syntax Button */}
          <button
            onClick={handleValidate}
            disabled={validating || !note.generated_code}
            className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 rounded-lg hover:bg-[var(--bg-control-hover)] disabled:opacity-40 text-xs font-semibold border mac-btn transition"
            style={{
              backgroundColor: 'var(--bg-control)',
              borderColor: 'var(--border-card)',
              color: 'var(--text-primary)'
            }}
          >
            <CheckCircle2 className={`w-3.5 h-3.5 ${validating ? 'animate-spin text-blue-500' : 'text-blue-500'}`} />
            <span className="hidden sm:inline">Validate Syntax</span>
            <span className="sm:hidden">Validate</span>
          </button>

          {/* Run Code Button */}
          <button
            onClick={handleExecute}
            disabled={executing || !note.generated_code}
            title="Execute safely in sandbox"
            className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs mac-btn transition active:scale-95 disabled:opacity-40"
          >
            <Play className={`w-3 h-3 ${executing ? 'animate-spin' : 'fill-white'}`} />
            <span className="hidden sm:inline">Run Code</span>
            <span className="sm:hidden">Run</span>
          </button>
        </div>

        {/* Regenerate Action */}
        <button
          onClick={onGenerateCode}
          disabled={isGenerating || !note.content.trim()}
          title="Regenerate code"
          className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-semibold border border-blue-500/30 mac-btn transition disabled:opacity-40"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Regenerate</span>
          <span className="sm:hidden">Regen</span>
        </button>
      </div>
    </div>
  );
};

