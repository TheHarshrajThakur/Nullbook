import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Play, Pause, RotateCcw, ChevronRight, ChevronLeft,
  FastForward, Shuffle, Sparkles, Code2, Copy, Check,
  SlidersHorizontal, Info, Compass, ArrowDown, ArrowRight,
  TrendingUp, Terminal, Layers
} from 'lucide-react';
import { AlgorithmMetadata, DsaCategory, DsaStep } from './types';
import {
  ALGORITHM_METADATA,
  generateBinarySearchSteps,
  generateTwoSumSteps,
  generateSlidingWindowSteps,
  generateBubbleSortSteps,
  generateQuickSortSteps,
  generateInsertionSortSteps,
  generateBstSearchSteps,
  generateTreeInorderSteps,
  generateReverseLinkedListSteps,
  generateFloydCycleSteps,
  generateValidParenthesesSteps,
  generateBfsGraphSteps
} from './algorithms';

interface DsaVisualizerProps {
  onInsertCode?: (code: string, language: string, title?: string) => void;
}

const CATEGORIES: { id: DsaCategory | 'all'; label: string; icon: string }[] = [
  { id: 'all', label: 'All', icon: '✨' },
  { id: 'arrays', label: 'Arrays & Search', icon: '🔍' },
  { id: 'sorting', label: 'Sorting', icon: '⚡' },
  { id: 'trees', label: 'Trees & BST', icon: '🌳' },
  { id: 'linked_lists', label: 'Linked Lists', icon: '🔗' },
  { id: 'stacks', label: 'Stacks & Queues', icon: '📦' },
  { id: 'graphs', label: 'Graphs', icon: '🕸️' }
];

export const DsaVisualizer: React.FC<DsaVisualizerProps> = ({ onInsertCode }) => {
  const [selectedCategory, setSelectedCategory] = useState<DsaCategory | 'all'>('all');
  const [selectedAlgoId, setSelectedAlgoId] = useState<string>('binary_search');
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speedMs, setSpeedMs] = useState<number>(800);
  const [customInput, setCustomInput] = useState<string>('');
  const [customTarget, setCustomTarget] = useState<string>('');
  const [showConfig, setShowConfig] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  const timerRef = useRef<any>(null);

  // Filtered algorithms list
  const filteredAlgorithms = useMemo(() => {
    if (selectedCategory === 'all') return ALGORITHM_METADATA;
    return ALGORITHM_METADATA.filter(a => a.category === selectedCategory);
  }, [selectedCategory]);

  const currentAlgo = useMemo(() => {
    return ALGORITHM_METADATA.find(a => a.id === selectedAlgoId) || ALGORITHM_METADATA[0];
  }, [selectedAlgoId]);

  // Sync inputs when algorithm changes
  useEffect(() => {
    setCustomInput(currentAlgo.defaultInput);
    if (currentAlgo.defaultTarget !== undefined) {
      setCustomTarget(String(currentAlgo.defaultTarget));
    } else {
      setCustomTarget('');
    }
    setCurrentStepIndex(0);
    setIsPlaying(false);
  }, [selectedAlgoId, currentAlgo]);

  // Generate algorithm steps dynamically based on inputs
  const steps: DsaStep[] = useMemo(() => {
    switch (currentAlgo.id) {
      case 'binary_search':
        return generateBinarySearchSteps(customInput, Number(customTarget) || 23);
      case 'two_sum':
        return generateTwoSumSteps(customInput, Number(customTarget) || 14);
      case 'sliding_window':
        return generateSlidingWindowSteps(customInput, Number(customTarget) || 3);
      case 'bubble_sort':
        return generateBubbleSortSteps(customInput);
      case 'quick_sort':
        return generateQuickSortSteps(customInput);
      case 'insertion_sort':
        return generateInsertionSortSteps(customInput);
      case 'bst_search':
        return generateBstSearchSteps(Number(customTarget) || 60);
      case 'tree_inorder':
        return generateTreeInorderSteps();
      case 'reverse_linked_list':
        return generateReverseLinkedListSteps(customInput);
      case 'floyd_cycle':
        return generateFloydCycleSteps();
      case 'valid_parentheses':
        return generateValidParenthesesSteps(customInput);
      case 'bfs_graph':
        return generateBfsGraphSteps();
      default:
        return generateBinarySearchSteps(customInput, 23);
    }
  }, [currentAlgo.id, customInput, customTarget]);

  const currentStep = steps[currentStepIndex] || steps[0];

  // Auto-play timer
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setTimeout(() => {
        if (currentStepIndex < steps.length - 1) {
          setCurrentStepIndex(prev => prev + 1);
        } else {
          setIsPlaying(false);
        }
      }, speedMs);
    } else {
      if (timerRef.current) clearTimeout(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPlaying, currentStepIndex, steps.length, speedMs]);

  // Controls
  const handlePlayPause = () => {
    if (currentStepIndex >= steps.length - 1) {
      setCurrentStepIndex(0);
      setIsPlaying(true);
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const handleStepForward = () => {
    setIsPlaying(false);
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    }
  };

  const handleStepBackward = () => {
    setIsPlaying(false);
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentStepIndex(0);
  };

  const handleRandomize = () => {
    const randomNums = Array.from({ length: 8 }, () => Math.floor(Math.random() * 90) + 10);
    if (currentAlgo.category === 'arrays' && currentAlgo.id === 'binary_search') {
      randomNums.sort((a, b) => a - b);
    }
    setCustomInput(randomNums.join(', '));
    if (currentAlgo.targetSupported) {
      const picked = randomNums[Math.floor(Math.random() * randomNums.length)];
      setCustomTarget(String(picked));
    }
    setCurrentStepIndex(0);
    setIsPlaying(false);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(currentAlgo.codeSnippet);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Color helper for pointers
  const getPointerBadgeColor = (color?: string) => {
    switch (color) {
      case 'blue': return 'bg-blue-500/20 text-blue-400 border-blue-500/40';
      case 'purple': return 'bg-purple-500/20 text-purple-400 border-purple-500/40';
      case 'amber': return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
      case 'emerald': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
      case 'rose': return 'bg-rose-500/20 text-rose-400 border-rose-500/40';
      default: return 'bg-sky-500/20 text-sky-400 border-sky-500/40';
    }
  };

  return (
    <div className="flex flex-col h-full w-full select-none overflow-hidden" style={{ backgroundColor: 'var(--bg-canvas)' }}>
      {/* Visualizer Header Bar */}
      <div className="p-3 border-b flex flex-col gap-2.5 shrink-0 mac-acrylic" style={{ borderColor: 'var(--border-subtle)' }}>
        {/* Top Algorithm Selection Row */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-xs">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <select
                  value={selectedAlgoId}
                  onChange={e => setSelectedAlgoId(e.target.value)}
                  className="bg-transparent font-semibold text-sm outline-none cursor-pointer border rounded-lg px-2 py-1 pr-6 mac-transition"
                  style={{
                    backgroundColor: 'var(--bg-control)',
                    borderColor: 'var(--border-card)',
                    color: 'var(--text-primary)'
                  }}
                >
                  {filteredAlgorithms.map(algo => (
                    <option key={algo.id} value={algo.id} style={{ backgroundColor: 'var(--bg-surface-elevated)', color: 'var(--text-primary)' }}>
                      {algo.name} ({algo.difficulty})
                    </option>
                  ))}
                </select>

                <div className="flex items-center gap-1.5 text-[10px] font-mono">
                  <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500 border border-blue-500/20">
                    Time: {currentAlgo.timeComplexity}
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-500 border border-purple-500/20">
                    Space: {currentAlgo.spaceComplexity}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Header Action Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowConfig(!showConfig)}
              title="Configure Custom Input"
              className={`p-1.5 rounded-lg border mac-btn transition text-xs flex items-center gap-1.5 ${
                showConfig ? 'bg-blue-600 text-white border-blue-500' : 'hover:bg-[var(--bg-control-hover)]'
              }`}
              style={!showConfig ? { borderColor: 'var(--border-card)', color: 'var(--text-secondary)' } : undefined}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Input</span>
            </button>

            {onInsertCode && (
              <button
                onClick={() => onInsertCode(currentAlgo.codeSnippet, currentAlgo.language, currentAlgo.name)}
                title="Insert algorithm implementation into note / editor"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-xs mac-btn transition active:scale-95"
              >
                <Code2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Insert Code</span>
              </button>
            )}

            <button
              onClick={handleCopyCode}
              title="Copy Clean Solution Code"
              className="p-1.5 rounded-lg border mac-btn transition hover:bg-[var(--bg-control-hover)]"
              style={{ borderColor: 'var(--border-card)', color: 'var(--text-secondary)' }}
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Category Filters Carousel */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap transition mac-btn ${
                selectedCategory === cat.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'hover:bg-[var(--bg-control-hover)]'
              }`}
              style={selectedCategory !== cat.id ? { color: 'var(--text-secondary)' } : undefined}
            >
              <span className="text-[11px]">{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Config Drawer for Custom Inputs */}
      {showConfig && (
        <div
          className="p-3 border-b flex flex-wrap items-center gap-2.5 text-xs mac-acrylic animate-fadeIn"
          style={{ backgroundColor: 'var(--bg-surface-elevated)', borderColor: 'var(--border-card)' }}
        >
          <div className="flex-1 min-w-[200px] flex items-center gap-2">
            <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>Input:</span>
            <input
              type="text"
              value={customInput}
              onChange={e => setCustomInput(e.target.value)}
              placeholder={currentAlgo.inputPlaceholder}
              className="flex-1 px-2.5 py-1 rounded-lg border text-xs outline-none font-mono"
              style={{
                backgroundColor: 'var(--bg-control)',
                borderColor: 'var(--border-card)',
                color: 'var(--text-primary)'
              }}
            />
          </div>

          {currentAlgo.targetSupported && (
            <div className="flex items-center gap-2">
              <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>Target:</span>
              <input
                type="text"
                value={customTarget}
                onChange={e => setCustomTarget(e.target.value)}
                placeholder="Target value"
                className="w-20 px-2 py-1 rounded-lg border text-xs outline-none font-mono"
                style={{
                  backgroundColor: 'var(--bg-control)',
                  borderColor: 'var(--border-card)',
                  color: 'var(--text-primary)'
                }}
              />
            </div>
          )}

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleRandomize}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg border hover:bg-[var(--bg-control-hover)] mac-btn transition"
              style={{ borderColor: 'var(--border-card)', color: 'var(--text-primary)' }}
            >
              <Shuffle className="w-3.5 h-3.5 text-blue-500" />
              <span>Randomize</span>
            </button>
            <button
              onClick={() => {
                setCurrentStepIndex(0);
                setIsPlaying(false);
              }}
              className="px-2.5 py-1 rounded-lg bg-blue-600 text-white font-medium mac-btn transition"
            >
              Apply
            </button>
          </div>
        </div>
      )}

      {/* Main Interactive Stage / Visual Canvas */}
      <div className="flex-1 flex flex-col min-h-0 relative p-4 overflow-y-auto">
        {/* Step Explanation Shelf */}
        <div
          className="p-3 rounded-xl border mb-4 mac-acrylic shadow-xs flex items-start gap-2.5"
          style={{
            backgroundColor: 'var(--bg-surface-elevated)',
            borderColor: 'var(--border-card)'
          }}
        >
          <div className="p-1 rounded-md bg-blue-500/10 text-blue-500 shrink-0 mt-0.5">
            <Info className="w-3.5 h-3.5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-500">
                Step {currentStep.stepIndex + 1} of {steps.length}
              </span>
              {currentStep.variables && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  {Object.entries(currentStep.variables).map(([k, v]) => (
                    <span
                      key={k}
                      className="text-[10px] font-mono px-1.5 py-0.5 rounded border"
                      style={{
                        backgroundColor: 'var(--bg-control)',
                        borderColor: 'var(--border-subtle)',
                        color: 'var(--text-secondary)'
                      }}
                    >
                      {k}: <strong style={{ color: 'var(--text-primary)' }}>{String(v)}</strong>
                    </span>
                  ))}
                </div>
              )}
            </div>
            <p className="text-xs font-medium leading-relaxed" style={{ color: 'var(--text-primary)' }}>
              {currentStep.description}
            </p>
          </div>
        </div>

        {/* --- DYNAMIC STAGE RENDERING BASED ON ALGORITHM CATEGORY --- */}
        <div className="flex-1 flex flex-col items-center justify-center min-h-[220px]">
          {/* 1. ARRAYS & SORTING VISUALIZER (Bars + Boxes + Pointers) */}
          {currentStep.arrayData && (
            <div className="w-full flex flex-col items-center justify-center py-4">
              {/* Vertical Bar Chart View */}
              <div className="flex items-end justify-center gap-2 sm:gap-3 h-44 w-full max-w-2xl px-4 border-b pb-1" style={{ borderColor: 'var(--border-subtle)' }}>
                {(() => {
                  const maxVal = Math.max(...currentStep.arrayData, 1);
                  return currentStep.arrayData.map((val, idx) => {
                    const isActive = currentStep.activeIndices?.includes(idx);
                    const isSwapped = currentStep.swappedIndices?.includes(idx);
                    const isSorted = currentStep.sortedIndices?.includes(idx);
                    const heightPercent = Math.max(14, Math.round((val / maxVal) * 100));

                    let barColor = 'rgba(59, 130, 246, 0.5)'; // default soft blue
                    let barBorder = 'rgba(59, 130, 246, 0.8)';
                    if (isSorted) {
                      barColor = 'rgba(16, 185, 129, 0.7)'; // emerald
                      barBorder = '#10b981';
                    } else if (isSwapped) {
                      barColor = 'rgba(239, 68, 68, 0.75)'; // rose
                      barBorder = '#ef4444';
                    } else if (isActive) {
                      barColor = 'rgba(245, 158, 11, 0.8)'; // amber
                      barBorder = '#f59e0b';
                    }

                    return (
                      <div key={idx} className="flex-1 max-w-[54px] flex flex-col items-center h-full justify-end group">
                        {/* Value Pill on top */}
                        <span className="text-[10px] font-mono font-bold mb-1 transition-all" style={{ color: 'var(--text-primary)' }}>
                          {val}
                        </span>
                        {/* Animated Bar */}
                        <div
                          className="w-full rounded-t-lg transition-all duration-300 relative shadow-sm"
                          style={{
                            height: `${heightPercent}%`,
                            backgroundColor: barColor,
                            border: `1.5px solid ${barBorder}`
                          }}
                        />
                      </div>
                    );
                  });
                })()}
              </div>

              {/* Index row & Floating Pointers */}
              <div className="flex justify-center gap-2 sm:gap-3 w-full max-w-2xl px-4 pt-2">
                {currentStep.arrayData.map((_, idx) => {
                  const pointer = currentStep.pointers?.find(p => Number(p.index) === idx);
                  return (
                    <div key={idx} className="flex-1 max-w-[54px] flex flex-col items-center">
                      <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
                        [{idx}]
                      </span>
                      {/* Pointer Tag */}
                      {pointer && (
                        <div className="flex flex-col items-center mt-1 animate-bounce">
                          <ArrowDown className="w-3 h-3 text-blue-500" />
                          <span className={`text-[9px] font-bold font-mono px-1.5 py-0.5 rounded-full border whitespace-nowrap shadow-xs ${getPointerBadgeColor(pointer.color)}`}>
                            {pointer.label}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. BINARY TREES / BST VISUALIZER (SVG Canvas) */}
          {currentStep.treeNodes && (
            <div className="w-full flex flex-col items-center justify-center py-2">
              <svg viewBox="0 0 460 220" className="w-full max-w-lg h-56 select-none">
                {/* Branch Connections */}
                <line x1="230" y1="35" x2="130" y2="95" stroke="var(--border-card)" strokeWidth="2.5" />
                <line x1="230" y1="35" x2="330" y2="95" stroke="var(--border-card)" strokeWidth="2.5" />
                <line x1="130" y1="95" x2="80" y2="165" stroke="var(--border-card)" strokeWidth="2" />
                <line x1="130" y1="95" x2="180" y2="165" stroke="var(--border-card)" strokeWidth="2" />
                <line x1="330" y1="95" x2="280" y2="165" stroke="var(--border-card)" strokeWidth="2" />
                <line x1="330" y1="95" x2="380" y2="165" stroke="var(--border-card)" strokeWidth="2" />

                {/* Node coordinates map */}
                {(() => {
                  const coords: Record<string, { x: number; y: number }> = {
                    '50': { x: 230, y: 35 },
                    '40': { x: 230, y: 35 },
                    '30': { x: 130, y: 95 },
                    '20': { x: 130, y: 95 },
                    '70': { x: 330, y: 95 },
                    '60': { x: 330, y: 95 },
                    '10': { x: 80, y: 165 },
                    '30_leaf': { x: 180, y: 165 },
                    '50_leaf': { x: 280, y: 165 },
                    '80': { x: 380, y: 165 }
                  };

                  return currentStep.treeNodes.map((node, i) => {
                    const fallbackPos = [
                      { x: 230, y: 35 },
                      { x: 130, y: 95 },
                      { x: 330, y: 95 },
                      { x: 80, y: 165 },
                      { x: 180, y: 165 },
                      { x: 280, y: 165 },
                      { x: 380, y: 165 }
                    ][i] || { x: 230, y: 35 };

                    const pos = coords[node.id] || fallbackPos;
                    let fill = 'var(--bg-surface-elevated)';
                    let stroke = 'var(--border-card)';
                    let textFill = 'var(--text-primary)';

                    if (node.status === 'active') {
                      fill = '#f59e0b';
                      stroke = '#d97706';
                      textFill = '#ffffff';
                    } else if (node.status === 'target') {
                      fill = '#10b981';
                      stroke = '#059669';
                      textFill = '#ffffff';
                    } else if (node.status === 'visited') {
                      fill = 'rgba(59, 130, 246, 0.3)';
                      stroke = '#3b82f6';
                    } else if (node.status === 'path') {
                      fill = 'rgba(168, 85, 247, 0.25)';
                      stroke = '#a855f7';
                    }

                    return (
                      <g key={node.id} className="transition-all duration-300 cursor-pointer">
                        <circle cx={pos.x} cy={pos.y} r="20" fill={fill} stroke={stroke} strokeWidth="2.5" />
                        <text
                          x={pos.x}
                          y={pos.y + 4}
                          textAnchor="middle"
                          fill={textFill}
                          fontSize="11"
                          fontWeight="bold"
                          fontFamily="monospace"
                        >
                          {node.val}
                        </text>
                      </g>
                    );
                  });
                })()}
              </svg>

              {/* Traversal Output Tape */}
              {currentStep.traversalOutput && (
                <div className="mt-3 flex items-center gap-2 text-xs font-mono">
                  <span className="font-sans font-semibold text-[11px]" style={{ color: 'var(--text-muted)' }}>Traversal Result:</span>
                  <div className="flex items-center gap-1.5 p-1.5 rounded-lg border mac-acrylic" style={{ backgroundColor: 'var(--bg-control)', borderColor: 'var(--border-card)' }}>
                    {currentStep.traversalOutput.map((v, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30 animate-fadeIn">
                        {v}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 3. LINKED LISTS VISUALIZER */}
          {currentStep.listNodes && (
            <div className="w-full flex flex-col items-center justify-center py-4">
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-center max-w-xl">
                {currentStep.listNodes.map((node, idx) => {
                  const pointer = currentStep.listPointers?.find(p => p.nodeId === node.id);
                  let nodeColor = 'var(--bg-surface-elevated)';
                  let borderColor = 'var(--border-card)';
                  if (node.status === 'active') {
                    borderColor = '#3b82f6';
                    nodeColor = 'rgba(59, 130, 246, 0.15)';
                  } else if (node.status === 'visited') {
                    borderColor = '#10b981';
                    nodeColor = 'rgba(16, 185, 129, 0.15)';
                  } else if (node.status === 'target') {
                    borderColor = '#ef4444';
                    nodeColor = 'rgba(239, 68, 68, 0.2)';
                  }

                  return (
                    <div key={node.id} className="flex items-center gap-2 sm:gap-3 mb-6">
                      <div className="flex flex-col items-center relative">
                        {/* Node Box */}
                        <div
                          className="flex items-center rounded-xl border-2 shadow-sm font-mono text-xs overflow-hidden transition-all duration-300"
                          style={{ backgroundColor: nodeColor, borderColor }}
                        >
                          <div className="px-3 py-2 font-bold" style={{ color: 'var(--text-primary)' }}>
                            {node.val}
                          </div>
                          <div className="px-2 py-2 border-l text-[10px] bg-black/10 text-blue-500" style={{ borderColor }}>
                            •
                          </div>
                        </div>

                        {/* Pointer Tag */}
                        {pointer && (
                          <div className="absolute top-full mt-1.5 flex flex-col items-center animate-bounce">
                            <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full border shadow-xs bg-blue-500/20 text-blue-400 border-blue-500/40 whitespace-nowrap">
                              {pointer.label}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Arrow Connector */}
                      {idx < currentStep.listNodes!.length - 1 ? (
                        <div className="flex items-center text-blue-500 transition-all">
                          {node.isReversed ? (
                            <span className="font-bold text-xs tracking-tighter">← [rev]</span>
                          ) : (
                            <ArrowRight className="w-4 h-4" />
                          )}
                        </div>
                      ) : (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/20" style={{ color: 'var(--text-muted)' }}>
                          NULL
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 4. STACK / PARENTHESES VISUALIZER */}
          {currentStep.stackItems && (
            <div className="w-full flex flex-col items-center justify-center py-2">
              <div className="flex flex-col items-center">
                <span className="text-[11px] font-semibold uppercase tracking-wider mb-2 text-indigo-400">
                  LIFO Stack Container
                </span>
                {/* Vertical Stack Tube */}
                <div
                  className="w-40 min-h-[160px] border-2 border-t-0 rounded-b-2xl p-2 flex flex-col-reverse items-center gap-1.5 shadow-inner mac-acrylic"
                  style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.15)',
                    borderColor: 'var(--border-card)'
                  }}
                >
                  {currentStep.stackItems.length === 0 ? (
                    <span className="text-[11px] font-mono my-auto" style={{ color: 'var(--text-muted)' }}>
                      [ Empty Stack ]
                    </span>
                  ) : (
                    currentStep.stackItems.map((item, idx) => (
                      <div
                        key={idx}
                        className="w-full py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-mono text-center font-bold text-sm shadow-sm animate-scaleIn"
                      >
                        {item}
                        {idx === currentStep.stackItems!.length - 1 && (
                          <span className="text-[9px] font-normal ml-2 bg-black/30 px-1 py-0.5 rounded">
                            TOP
                          </span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 5. GRAPH BFS VISUALIZER */}
          {currentStep.graphNodes && (
            <div className="w-full flex flex-col items-center justify-center py-2">
              <svg viewBox="0 0 380 180" className="w-full max-w-md h-48 select-none">
                {/* Graph Edges */}
                {currentStep.graphEdges?.map((e, idx) => {
                  const nodePositions: Record<string, { x: number; y: number }> = {
                    A: { x: 50, y: 90 },
                    B: { x: 150, y: 40 },
                    C: { x: 150, y: 140 },
                    D: { x: 270, y: 30 },
                    E: { x: 270, y: 80 },
                    F: { x: 270, y: 140 }
                  };
                  const p1 = nodePositions[e.from] || { x: 50, y: 90 };
                  const p2 = nodePositions[e.to] || { x: 150, y: 40 };

                  return (
                    <line
                      key={idx}
                      x1={p1.x}
                      y1={p1.y}
                      x2={p2.x}
                      y2={p2.y}
                      stroke={e.active ? '#3b82f6' : 'var(--border-card)'}
                      strokeWidth={e.active ? '3' : '1.5'}
                      strokeDasharray={e.active ? '4' : 'none'}
                    />
                  );
                })}

                {/* Graph Vertices */}
                {(() => {
                  const nodePositions: Record<string, { x: number; y: number }> = {
                    A: { x: 50, y: 90 },
                    B: { x: 150, y: 40 },
                    C: { x: 150, y: 140 },
                    D: { x: 270, y: 30 },
                    E: { x: 270, y: 80 },
                    F: { x: 270, y: 140 }
                  };

                  return currentStep.graphNodes.map(node => {
                    const pos = nodePositions[node.id] || { x: 50, y: 90 };
                    let fill = 'var(--bg-surface-elevated)';
                    let stroke = 'var(--border-card)';
                    let textFill = 'var(--text-primary)';

                    if (node.status === 'active') {
                      fill = '#f59e0b';
                      stroke = '#d97706';
                      textFill = '#fff';
                    } else if (node.status === 'queue') {
                      fill = '#3b82f6';
                      stroke = '#2563eb';
                      textFill = '#fff';
                    } else if (node.status === 'visited') {
                      fill = '#10b981';
                      stroke = '#059669';
                      textFill = '#fff';
                    }

                    return (
                      <g key={node.id} className="transition-all duration-300">
                        <circle cx={pos.x} cy={pos.y} r="18" fill={fill} stroke={stroke} strokeWidth="2.5" />
                        <text
                          x={pos.x}
                          y={pos.y + 4}
                          textAnchor="middle"
                          fill={textFill}
                          fontSize="11"
                          fontWeight="bold"
                          fontFamily="monospace"
                        >
                          {node.label}
                        </text>
                      </g>
                    );
                  });
                })()}
              </svg>

              {/* Queue Tape */}
              {currentStep.queueItems && (
                <div className="mt-2 flex items-center gap-2 text-xs font-mono">
                  <span className="font-sans font-semibold text-[11px]" style={{ color: 'var(--text-muted)' }}>FIFO Queue:</span>
                  <div className="flex items-center gap-1.5 p-1.5 rounded-lg border mac-acrylic" style={{ backgroundColor: 'var(--bg-control)', borderColor: 'var(--border-card)' }}>
                    {currentStep.queueItems.length === 0 ? (
                      <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Empty</span>
                    ) : (
                      currentStep.queueItems.map((v, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-bold border border-blue-500/30">
                          {v}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Code Snippet with Live Line Highlighting */}
        <div
          className="mt-4 rounded-xl border overflow-hidden mac-acrylic shadow-sm shrink-0"
          style={{
            backgroundColor: 'var(--bg-code-editor)',
            borderColor: 'var(--border-card)'
          }}
        >
          <div className="px-3 py-1.5 border-b flex items-center justify-between text-[11px] font-mono" style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}>
            <span className="font-sans font-semibold text-blue-500">{currentAlgo.name} — Python Implementation</span>
            <span>Line {currentStep.codeLine || 1}</span>
          </div>
          <div className="p-3 font-mono text-[11px] leading-5 overflow-x-auto">
            {currentAlgo.codeSnippet.split('\n').map((line, idx) => {
              const lineNum = idx + 1;
              const isHighlight = currentStep.codeLine === lineNum;
              return (
                <div
                  key={idx}
                  className={`flex items-center gap-3 px-2 rounded transition-colors ${
                    isHighlight ? 'bg-blue-600/25 border-l-2 border-blue-500 font-semibold text-blue-200' : 'opacity-85'
                  }`}
                  style={{ color: isHighlight ? undefined : 'var(--text-code)' }}
                >
                  <span className="w-5 text-right opacity-30 select-none text-[10px]">{lineNum}</span>
                  <pre className="m-0 font-mono whitespace-pre">{line}</pre>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Control Deck (Player & Timeline) */}
      <div className="p-3 border-t flex flex-col gap-2 shrink-0 mac-acrylic" style={{ borderColor: 'var(--border-subtle)' }}>
        {/* Timeline Slider */}
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={0}
            max={steps.length - 1}
            value={currentStepIndex}
            onChange={e => {
              setIsPlaying(false);
              setCurrentStepIndex(Number(e.target.value));
            }}
            className="flex-1 accent-blue-600 h-1.5 rounded-lg cursor-pointer bg-slate-700"
          />
          <span className="text-[11px] font-mono font-semibold min-w-[50px] text-right" style={{ color: 'var(--text-secondary)' }}>
            {currentStepIndex + 1}/{steps.length}
          </span>
        </div>

        {/* Playback Controls & Speed */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            {/* Reset */}
            <button
              onClick={handleReset}
              title="Reset to Start"
              className="p-1.5 rounded-lg border mac-btn transition hover:bg-[var(--bg-control-hover)]"
              style={{ borderColor: 'var(--border-card)', color: 'var(--text-secondary)' }}
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Prev Step */}
            <button
              onClick={handleStepBackward}
              disabled={currentStepIndex === 0}
              title="Previous Step"
              className="p-1.5 rounded-lg border mac-btn transition hover:bg-[var(--bg-control-hover)] disabled:opacity-30"
              style={{ borderColor: 'var(--border-card)', color: 'var(--text-secondary)' }}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Play / Pause Primary Button */}
            <button
              onClick={handlePlayPause}
              title={isPlaying ? 'Pause' : 'Play Simulation'}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-md mac-btn transition active:scale-95"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-4 h-4" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  <span>{currentStepIndex >= steps.length - 1 ? 'Replay' : 'Play'}</span>
                </>
              )}
            </button>

            {/* Next Step */}
            <button
              onClick={handleStepForward}
              disabled={currentStepIndex === steps.length - 1}
              title="Next Step"
              className="p-1.5 rounded-lg border mac-btn transition hover:bg-[var(--bg-control-hover)] disabled:opacity-30"
              style={{ borderColor: 'var(--border-card)', color: 'var(--text-secondary)' }}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Speed Selector */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-[10px] font-semibold uppercase mr-1" style={{ color: 'var(--text-muted)' }}>Speed:</span>
            {[
              { label: '0.5x', ms: 1200 },
              { label: '1x', ms: 800 },
              { label: '2x', ms: 400 },
              { label: '4x', ms: 200 }
            ].map(s => (
              <button
                key={s.label}
                onClick={() => setSpeedMs(s.ms)}
                className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold transition mac-btn ${
                  speedMs === s.ms ? 'bg-blue-600 text-white shadow-xs' : 'hover:bg-[var(--bg-control-hover)]'
                }`}
                style={speedMs !== s.ms ? { color: 'var(--text-secondary)' } : undefined}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
