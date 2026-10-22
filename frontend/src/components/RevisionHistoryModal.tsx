import React, { useState, useEffect } from 'react';
import { History, X, RotateCcw, Code, CheckCircle2, Clock, Sparkles } from 'lucide-react';
import { Revision, Note } from '../types';
import { api } from '../services/api';

interface RevisionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  note: Note | null;
  onRestoreRevision: (revisedNote: Note) => void;
}

export const RevisionHistoryModal: React.FC<RevisionHistoryModalProps> = ({
  isOpen,
  onClose,
  note,
  onRestoreRevision
}) => {
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [selectedRevision, setSelectedRevision] = useState<Revision | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && note) {
      setLoading(true);
      api.getRevisions(note.id)
        .then(revs => {
          setRevisions(revs);
          if (revs.length > 0) setSelectedRevision(revs[0]);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [isOpen, note]);

  if (!isOpen || !note) return null;

  const handleRestore = async (revId: string) => {
    try {
      const updated = await api.restoreRevision(note.id, revId);
      onRestoreRevision(updated);
      onClose();
    } catch (e: any) {
      alert(e.message || 'Failed to restore revision');
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50 select-none animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="w-full max-w-4xl h-[580px] rounded-2xl border mac-acrylic mac-window-shadow flex flex-col overflow-hidden text-left mac-inset-highlight animate-in zoom-in-95 duration-150"
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
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white tracking-tight">Revision Timeline</h3>
              <p className="text-[11px] text-gray-400">
                Preserved code generation drafts for: <strong className="text-gray-200">{note.title}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.08] mac-btn transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Split: Left Revisions List, Right Code Viewer */}
        <div className="flex-1 flex overflow-hidden">
          {/* Revisions Sidebar List */}
          <div
            className="w-72 border-r overflow-y-auto p-2.5 space-y-1.5"
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.25)',
              borderColor: 'var(--border-subtle)'
            }}
          >
            {loading ? (
              <div className="p-6 text-center text-xs text-gray-400 flex items-center justify-center gap-2">
                <div className="w-3.5 h-3.5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                <span>Loading timeline...</span>
              </div>
            ) : revisions.length === 0 ? (
              <div className="p-6 text-center text-xs text-gray-400 leading-relaxed">
                No previous snapshots recorded yet. When code is generated or revised, snapshots are preserved here automatically.
              </div>
            ) : (
              revisions.map(rev => {
                const isSelected = selectedRevision?.id === rev.id;
                return (
                  <div
                    key={rev.id}
                    onClick={() => setSelectedRevision(rev)}
                    className={`p-3 rounded-xl cursor-pointer mac-transition text-left border ${
                      isSelected
                        ? 'bg-blue-600/15 border-blue-500/40 text-white shadow-xs'
                        : 'border-transparent hover:bg-white/[0.04] text-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-xs text-white">
                        Revision #{rev.revision_number}
                      </span>
                      <span className="text-[9px] text-blue-300 font-mono uppercase px-1.5 py-0.2 rounded-md bg-blue-500/20 border border-blue-500/25">
                        {rev.language}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 line-clamp-1 mb-1.5 italic">
                      "{rev.instruction}"
                    </p>
                    <div className="flex items-center gap-1 text-[10px] text-gray-500 font-mono">
                      <Clock className="w-3 h-3 text-gray-500" />
                      <span>{new Date(rev.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(rev.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Revision Preview Area */}
          <div className="flex-1 flex flex-col overflow-hidden bg-[#060910]">
            {selectedRevision ? (
              <>
                <div
                  className="p-3 px-4 border-b flex items-center justify-between bg-black/30"
                  style={{ borderColor: 'var(--border-subtle)' }}
                >
                  <div>
                    <span className="text-xs font-semibold text-white tracking-tight">
                      Revision #{selectedRevision.revision_number} ({selectedRevision.language.toUpperCase()})
                    </span>
                    <p className="text-[11px] text-gray-400 truncate max-w-md">
                      Prompt: "{selectedRevision.instruction}"
                    </p>
                  </div>
                  <button
                    onClick={() => handleRestore(selectedRevision.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-xs mac-btn transition active:scale-95"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Restore Version</span>
                  </button>
                </div>

                <div className="flex-1 p-4 overflow-auto font-mono text-xs text-blue-50 whitespace-pre leading-relaxed code-font">
                  {selectedRevision.generated_code}
                </div>

                {selectedRevision.explanation && (
                  <div
                    className="p-3 px-4 border-t bg-black/40 text-[11px] text-gray-300 max-h-28 overflow-y-auto font-sans"
                    style={{ borderColor: 'var(--border-subtle)' }}
                  >
                    <span className="font-semibold text-gray-300 block mb-1">Architecture Explanation:</span>
                    <p className="leading-relaxed">{selectedRevision.explanation}</p>
                  </div>
                )}
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-xs text-gray-500 font-medium">
                Select a revision to preview code
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

