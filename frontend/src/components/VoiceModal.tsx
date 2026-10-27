import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, X, Sparkles, AlertTriangle, CheckCircle, ArrowRight, Volume2, CornerDownLeft, Radio } from 'lucide-react';
import { VoiceCommandResponse } from '../types';
import { api } from '../services/api';

interface VoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExecuteAction: (action: string, params: Record<string, any>) => void;
  onInsertDictation: (text: string) => void;
}

export const VoiceModal: React.FC<VoiceModalProps> = ({
  isOpen,
  onClose,
  onExecuteAction,
  onInsertDictation
}) => {
  const [mode, setMode] = useState<'command' | 'dictation'>('command');
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [manualInput, setManualInput] = useState('');
  const [parsedCommand, setParsedCommand] = useState<VoiceCommandResponse | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check if webkitSpeechRecognition is available in browser / Electron
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Microphone recognition is not active in this browser context. You can type commands directly in the field below.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      if (transcript.trim()) {
        handleProcessTranscript(transcript);
      }
    } else {
      setTranscript('');
      setParsedCommand(null);
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleProcessTranscript = async (text: string) => {
    if (!text.trim()) return;

    if (mode === 'dictation') {
      onInsertDictation(text.trim());
      onClose();
      return;
    }

    // Command Mode
    try {
      const res = await api.parseVoiceCommand(text);
      setParsedCommand(res);
      if (res.requires_confirmation) {
        setShowConfirmation(true);
      } else if (res.action !== 'unknown' && res.action !== 'dictation') {
        onExecuteAction(res.action, res.parameters);
        setTimeout(onClose, 600);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleConfirmAction = () => {
    if (parsedCommand) {
      onExecuteAction(parsedCommand.action, parsedCommand.parameters);
      setShowConfirmation(false);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50 select-none animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="w-full max-w-lg rounded-2xl border mac-acrylic mac-window-shadow overflow-hidden text-left mac-inset-highlight animate-in zoom-in-95 duration-150"
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
            <div className="w-8 h-8 rounded-xl bg-red-500/15 border border-red-500/30 text-red-500 flex items-center justify-center">
              <Mic className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>Offline Voice Control</h3>
              <p className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>Dictate natural speech or execute commands hands-free</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/[0.08] mac-btn transition"
            style={{ color: 'var(--text-tertiary)' }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* macOS Segmented Mode Switcher */}
        <div className="p-3 px-5 border-b flex justify-center" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-control)' }}>
          <div className="mac-segmented w-full max-w-xs">
            <button
              onClick={() => setMode('command')}
              className={`flex-1 py-1 text-xs font-semibold rounded-md transition ${
                mode === 'command'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'hover:opacity-100'
              }`}
              style={{ color: mode === 'command' ? '#ffffff' : 'var(--text-secondary)' }}
            >
              Command Mode
            </button>
            <button
              onClick={() => setMode('dictation')}
              className={`flex-1 py-1 text-xs font-semibold rounded-md transition ${
                mode === 'dictation'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'hover:opacity-100'
              }`}
              style={{ color: mode === 'dictation' ? '#ffffff' : 'var(--text-secondary)' }}
            >
              Dictation Mode
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 flex flex-col items-center text-center space-y-4">
          {/* Animated Microphone Orb */}
          <div className="relative my-2">
            {isListening && (
              <span className="absolute -inset-3 rounded-full bg-red-500/30 animate-ping opacity-75" />
            )}
            <button
              onClick={toggleListening}
              className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 mac-btn ${
                isListening
                  ? 'bg-gradient-to-tr from-red-600 to-rose-500 text-white shadow-[0_0_25px_rgba(239,68,68,0.6)] scale-105'
                  : 'bg-gradient-to-tr from-blue-600 to-indigo-500 hover:from-blue-500 hover:to-indigo-400 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]'
              }`}
            >
              {isListening ? <Mic className="w-7 h-7" /> : <MicOff className="w-7 h-7" />}
            </button>
          </div>

          <div>
            <p className="text-xs font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              {isListening ? 'Listening locally... Speak clearly' : 'Click microphone to record'}
            </p>
            <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>Zero cloud data transmission</p>
          </div>

          {/* Transcript Preview Box */}
          <div
            className="w-full min-h-[64px] p-3.5 rounded-xl border text-xs text-left"
            style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-input)' }}
          >
            <span className="text-[9px] block mb-1 uppercase font-semibold tracking-wider font-mono" style={{ color: 'var(--text-muted)' }}>
              Live Transcript:
            </span>
            <p className="leading-relaxed font-sans" style={{ color: 'var(--text-primary)' }}>
              {transcript || (manualInput ? manualInput : <span className="italic" style={{ color: 'var(--text-muted)' }}>Say a command or type text below...</span>)}
            </p>
          </div>

          {/* Manual Input Fallback */}
          <div className="w-full flex items-center gap-2 pt-1">
            <input
              type="text"
              value={manualInput}
              onChange={e => setManualInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleProcessTranscript(manualInput);
              }}
              placeholder="Or type voice command directly..."
              className="flex-1 border rounded-xl px-3 py-2 text-xs outline-none focus:border-blue-500/60 transition font-sans"
              style={{
                borderColor: 'var(--border-card)',
                backgroundColor: 'var(--bg-input)',
                color: 'var(--text-primary)'
              }}
            />
            <button
              onClick={() => handleProcessTranscript(manualInput)}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-xs mac-btn transition active:scale-95"
            >
              Execute
            </button>
          </div>

          {/* Confirmation Alert Dialog */}
          {showConfirmation && parsedCommand && (
            <div className="w-full p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-left space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-500 dark:text-amber-300">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Confirmation Required</span>
              </div>
              <p className="text-[11px] text-amber-600 dark:text-amber-200">{parsedCommand.confirmation_message}</p>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={() => setShowConfirmation(false)}
                  className="px-3 py-1 text-xs rounded-lg mac-btn border"
                  style={{
                    backgroundColor: 'var(--bg-control)',
                    borderColor: 'var(--border-card)',
                    color: 'var(--text-secondary)'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmAction}
                  className="px-3 py-1 text-xs rounded-lg bg-red-600 text-white font-semibold hover:bg-red-500 mac-btn"
                >
                  Confirm Action
                </button>
              </div>
            </div>
          )}

          {/* Example Command Chips */}
          <div className="w-full text-left pt-3 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
            <p className="text-[9px] font-semibold uppercase tracking-wider mb-2 font-mono" style={{ color: 'var(--text-muted)' }}>
              Supported Commands:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {[
                "Create a new note",
                "Generate Python code",
                "Switch language to C++",
                "Search for sorting algorithm",
                "Categorise note"
              ].map(cmd => (
                <button
                  key={cmd}
                  onClick={() => handleProcessTranscript(cmd)}
                  className="px-2 py-0.5 rounded-md text-[10px] font-medium border transition"
                  style={{
                    backgroundColor: 'var(--bg-control)',
                    borderColor: 'var(--border-card)',
                    color: 'var(--text-secondary)'
                  }}
                >
                  "{cmd}"
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

