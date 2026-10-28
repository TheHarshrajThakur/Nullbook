export type DsaCategory = 'arrays' | 'sorting' | 'trees' | 'linked_lists' | 'stacks' | 'graphs';

export interface DsaPointer {
  index: number | string;
  label: string;
  color?: 'blue' | 'purple' | 'amber' | 'emerald' | 'rose' | 'cyan';
}

export interface DsaStep {
  stepIndex: number;
  description: string;
  codeLine?: number;
  variables?: Record<string, string | number | boolean>;
  // Arrays & Sorting
  arrayData?: number[];
  activeIndices?: number[];
  swappedIndices?: number[];
  sortedIndices?: number[];
  pointers?: DsaPointer[];
  // Trees
  treeNodes?: Array<{
    id: string;
    val: number | string;
    leftId?: string | null;
    rightId?: string | null;
    status?: 'default' | 'active' | 'visited' | 'target' | 'path';
  }>;
  traversalOutput?: Array<number | string>;
  // Linked Lists
  listNodes?: Array<{
    id: string;
    val: number | string;
    nextId?: string | null;
    isReversed?: boolean;
    status?: 'default' | 'active' | 'visited' | 'target';
  }>;
  listPointers?: Array<{
    nodeId: string;
    label: string;
    color?: string;
  }>;
  // Stacks & Queues
  stackItems?: string[];
  queueItems?: string[];
  currentCharIndex?: number;
  // Graph
  graphNodes?: Array<{
    id: string;
    label: string;
    status?: 'unvisited' | 'queue' | 'active' | 'visited';
  }>;
  graphEdges?: Array<{
    from: string;
    to: string;
    active?: boolean;
  }>;
}

export interface AlgorithmMetadata {
  id: string;
  name: string;
  category: DsaCategory;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  timeComplexity: string;
  spaceComplexity: string;
  description: string;
  codeSnippet: string;
  language: string;
  defaultInput: string;
  inputPlaceholder: string;
  targetSupported?: boolean;
  defaultTarget?: number | string;
}
