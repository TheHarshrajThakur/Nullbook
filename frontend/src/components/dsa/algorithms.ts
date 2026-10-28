import { AlgorithmMetadata, DsaStep } from './types';

export const ALGORITHM_METADATA: AlgorithmMetadata[] = [
  // --- Arrays & Searching ---
  {
    id: 'binary_search',
    name: 'Binary Search',
    category: 'arrays',
    difficulty: 'Easy',
    timeComplexity: 'O(log n)',
    spaceComplexity: 'O(1)',
    description: 'Finds the position of a target value within a sorted array by repeatedly dividing the search interval in half.',
    language: 'python',
    codeSnippet: `def binary_search(arr, target):
    low = 0
    high = len(arr) - 1
    while low <= high:
        mid = (low + high) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            low = mid + 1
        else:
            high = mid - 1
    return -1`,
    defaultInput: '2, 5, 8, 12, 16, 23, 38, 56, 72, 91',
    inputPlaceholder: 'Sorted numbers separated by comma',
    targetSupported: true,
    defaultTarget: 23
  },
  {
    id: 'two_sum',
    name: 'Two Pointers (Two Sum)',
    category: 'arrays',
    difficulty: 'Easy',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(1)',
    description: 'Finds two numbers in a sorted array that sum up to a specific target value using inward-converging pointers.',
    language: 'python',
    codeSnippet: `def two_sum_sorted(arr, target):
    left = 0
    right = len(arr) - 1
    while left < right:
        curr_sum = arr[left] + arr[right]
        if curr_sum == target:
            return [left, right]
        elif curr_sum < target:
            left += 1
        else:
            right -= 1
    return None`,
    defaultInput: '1, 3, 4, 6, 8, 11, 15',
    inputPlaceholder: 'Sorted numbers separated by comma',
    targetSupported: true,
    defaultTarget: 14
  },
  {
    id: 'sliding_window',
    name: 'Sliding Window (Max Sum K)',
    category: 'arrays',
    difficulty: 'Medium',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(1)',
    description: 'Finds maximum subarray sum of fixed window size K by maintaining a running total as the window slides.',
    language: 'python',
    codeSnippet: `def max_sub_array_of_size_k(k, arr):
    max_sum = 0
    window_sum = sum(arr[:k])
    max_sum = window_sum
    for i in range(len(arr) - k):
        window_sum = window_sum - arr[i] + arr[i + k]
        max_sum = max(max_sum, window_sum)
    return max_sum`,
    defaultInput: '2, 1, 5, 1, 3, 2, 7, 4',
    inputPlaceholder: 'Array of numbers separated by comma',
    targetSupported: true,
    defaultTarget: 3
  },

  // --- Sorting ---
  {
    id: 'bubble_sort',
    name: 'Bubble Sort',
    category: 'sorting',
    difficulty: 'Easy',
    timeComplexity: 'O(n²)',
    spaceComplexity: 'O(1)',
    description: 'Repeatedly steps through the list, compares adjacent elements, and swaps them if they are in the wrong order.',
    language: 'python',
    codeSnippet: `def bubble_sort(arr):
    n = len(arr)
    for i in range(n):
        swapped = False
        for j in range(0, n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
                swapped = True
        if not swapped:
            break
    return arr`,
    defaultInput: '45, 12, 85, 32, 89, 39, 69, 22',
    inputPlaceholder: 'Numbers separated by comma',
    targetSupported: false
  },
  {
    id: 'quick_sort',
    name: 'Quick Sort (Partitioning)',
    category: 'sorting',
    difficulty: 'Medium',
    timeComplexity: 'O(n log n)',
    spaceComplexity: 'O(log n)',
    description: 'Divide-and-conquer algorithm that selects a pivot element and partitions the array into smaller and greater elements.',
    language: 'python',
    codeSnippet: `def partition(arr, low, high):
    pivot = arr[high]
    i = low - 1
    for j in range(low, high):
        if arr[j] <= pivot:
            i += 1
            arr[i], arr[j] = arr[j], arr[i]
    arr[i + 1], arr[high] = arr[high], arr[i + 1]
    return i + 1`,
    defaultInput: '38, 27, 43, 3, 9, 82, 10',
    inputPlaceholder: 'Numbers separated by comma',
    targetSupported: false
  },
  {
    id: 'insertion_sort',
    name: 'Insertion Sort',
    category: 'sorting',
    difficulty: 'Easy',
    timeComplexity: 'O(n²)',
    spaceComplexity: 'O(1)',
    description: 'Builds the final sorted array one item at a time by inserting each element into its proper position in the sorted prefix.',
    language: 'python',
    codeSnippet: `def insertion_sort(arr):
    for i in range(1, len(arr)):
        key = arr[i]
        j = i - 1
        while j >= 0 and key < arr[j]:
            arr[j + 1] = arr[j]
            j -= 1
        arr[j + 1] = key
    return arr`,
    defaultInput: '29, 10, 14, 37, 13',
    inputPlaceholder: 'Numbers separated by comma',
    targetSupported: false
  },

  // --- Trees ---
  {
    id: 'bst_search',
    name: 'Binary Search Tree (BST)',
    category: 'trees',
    difficulty: 'Easy',
    timeComplexity: 'O(log n)',
    spaceComplexity: 'O(h)',
    description: 'Searches for a key in a Binary Search Tree by comparing with current node and choosing left or right child.',
    language: 'python',
    codeSnippet: `def search_bst(root, val):
    curr = root
    while curr:
        if curr.val == val:
            return curr
        elif val < curr.val:
            curr = curr.left
        else:
            curr = curr.right
    return None`,
    defaultInput: '50, 30, 70, 20, 40, 60, 80',
    inputPlaceholder: 'Tree node values in level-order',
    targetSupported: true,
    defaultTarget: 60
  },
  {
    id: 'tree_inorder',
    name: 'In-Order Tree Traversal (L-Root-R)',
    category: 'trees',
    difficulty: 'Easy',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(h)',
    description: 'Traverses left subtree, visits root, then traverses right subtree. For BSTs, this produces nodes in ascending order.',
    language: 'python',
    codeSnippet: `def inorder_traversal(root):
    result = []
    def dfs(node):
        if not node: return
        dfs(node.left)
        result.append(node.val)
        dfs(node.right)
    dfs(root)
    return result`,
    defaultInput: '40, 20, 60, 10, 30, 50, 70',
    inputPlaceholder: 'Tree node values in level-order',
    targetSupported: false
  },

  // --- Linked Lists ---
  {
    id: 'reverse_linked_list',
    name: 'Reverse Linked List',
    category: 'linked_lists',
    difficulty: 'Easy',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(1)',
    description: 'Reverses a singly linked list in-place by updating each node’s next pointer to point to its predecessor.',
    language: 'python',
    codeSnippet: `def reverse_list(head):
    prev = None
    curr = head
    while curr:
        next_temp = curr.next
        curr.next = prev
        prev = curr
        curr = next_temp
    return prev`,
    defaultInput: '1, 2, 3, 4, 5',
    inputPlaceholder: 'Values separated by comma',
    targetSupported: false
  },
  {
    id: 'floyd_cycle',
    name: "Floyd's Cycle Detection",
    category: 'linked_lists',
    difficulty: 'Medium',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(1)',
    description: 'Tortoise and Hare algorithm detects whether a linked list contains a cycle using two pointers moving at different speeds.',
    language: 'python',
    codeSnippet: `def has_cycle(head):
    slow = head
    fast = head
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next
        if slow == fast:
            return True
    return False`,
    defaultInput: '10, 20, 30, 40, 50, 60',
    inputPlaceholder: 'Values (cycle will connect tail to node 30)',
    targetSupported: false
  },

  // --- Stacks ---
  {
    id: 'valid_parentheses',
    name: 'Valid Parentheses (Stack)',
    category: 'stacks',
    difficulty: 'Easy',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(n)',
    description: 'Determines if the input string of brackets ()[]{} is valid by pushing openers and matching closers with the stack top.',
    language: 'python',
    codeSnippet: `def is_valid_parentheses(s):
    stack = []
    mapping = {")": "(", "}": "{", "]": "["}
    for char in s:
        if char in mapping:
            top_element = stack.pop() if stack else '#'
            if mapping[char] != top_element:
                return False
        else:
            stack.append(char)
    return not stack`,
    defaultInput: '{ [ ( ) ] }',
    inputPlaceholder: 'Bracket sequence e.g. {[()]}',
    targetSupported: false
  },

  // --- Graphs ---
  {
    id: 'bfs_graph',
    name: 'Breadth-First Search (BFS)',
    category: 'graphs',
    difficulty: 'Medium',
    timeComplexity: 'O(V + E)',
    spaceComplexity: 'O(V)',
    description: 'Explores graph neighbor by neighbor level-by-level using a FIFO queue, ideal for finding shortest path in unweighted graphs.',
    language: 'python',
    codeSnippet: `from collections import deque
def bfs(graph, start_node):
    visited = set([start_node])
    queue = deque([start_node])
    traversal = []
    while queue:
        vertex = queue.popleft()
        traversal.append(vertex)
        for neighbor in graph[vertex]:
            if neighbor not in visited:
                visited.add(neighbor)
                queue.append(neighbor)
    return traversal`,
    defaultInput: 'A, B, C, D, E, F',
    inputPlaceholder: 'Graph nodes',
    targetSupported: false
  }
];

// Helper to parse comma separated numbers
export function parseNumberArray(input: string, fallback: number[]): number[] {
  try {
    const parts = input.split(',').map(s => s.trim()).filter(s => s.length > 0);
    const nums = parts.map(s => Number(s)).filter(n => !isNaN(n));
    return nums.length > 0 ? nums : fallback;
  } catch {
    return fallback;
  }
}

// -------------------------------------------------------------
// Step Generators
// -------------------------------------------------------------

export function generateBinarySearchSteps(rawInput: string, rawTarget: number): DsaStep[] {
  const arr = parseNumberArray(rawInput, [2, 5, 8, 12, 16, 23, 38, 56, 72, 91]).sort((a, b) => a - b);
  const target = Number(rawTarget) || 23;
  const steps: DsaStep[] = [];

  let low = 0;
  let high = arr.length - 1;
  let stepIdx = 0;

  steps.push({
    stepIndex: stepIdx++,
    description: `Initialize Binary Search: low = 0 (val: ${arr[0]}), high = ${high} (val: ${arr[high]}). Target = ${target}`,
    codeLine: 2,
    variables: { low, high, target },
    arrayData: [...arr],
    pointers: [
      { index: low, label: 'low', color: 'blue' },
      { index: high, label: 'high', color: 'orange' }
    ]
  });

  let found = false;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const midVal = arr[mid];

    steps.push({
      stepIndex: stepIdx++,
      description: `Calculate mid = Math.floor((${low} + ${high}) / 2) = ${mid}. Checking arr[mid] = ${midVal}`,
      codeLine: 5,
      variables: { low, mid, high, 'arr[mid]': midVal, target },
      arrayData: [...arr],
      activeIndices: [mid],
      pointers: [
        { index: low, label: 'low', color: 'blue' },
        { index: mid, label: 'mid', color: 'purple' },
        { index: high, label: 'high', color: 'orange' }
      ]
    });

    if (midVal === target) {
      steps.push({
        stepIndex: stepIdx++,
        description: `Target ${target} found at index ${mid}! (arr[${mid}] == ${target})`,
        codeLine: 7,
        variables: { result: mid, target },
        arrayData: [...arr],
        sortedIndices: [mid],
        pointers: [{ index: mid, label: '🎯 FOUND', color: 'emerald' }]
      });
      found = true;
      break;
    } else if (midVal < target) {
      steps.push({
        stepIndex: stepIdx++,
        description: `arr[${mid}] (${midVal}) < target (${target}). Target must be in the right half. Move low = mid + 1 (${mid + 1})`,
        codeLine: 9,
        variables: { old_low: low, new_low: mid + 1, high },
        arrayData: [...arr],
        activeIndices: [mid],
        pointers: [
          { index: mid + 1 <= high ? mid + 1 : high, label: 'low →', color: 'blue' },
          { index: high, label: 'high', color: 'orange' }
        ]
      });
      low = mid + 1;
    } else {
      steps.push({
        stepIndex: stepIdx++,
        description: `arr[${mid}] (${midVal}) > target (${target}). Target must be in the left half. Move high = mid - 1 (${mid - 1})`,
        codeLine: 11,
        variables: { low, old_high: high, new_high: mid - 1 },
        arrayData: [...arr],
        activeIndices: [mid],
        pointers: [
          { index: low, label: 'low', color: 'blue' },
          { index: mid - 1 >= low ? mid - 1 : low, label: '← high', color: 'orange' }
        ]
      });
      high = mid - 1;
    }
  }

  if (!found) {
    steps.push({
      stepIndex: stepIdx++,
      description: `Search completed: Target ${target} does not exist in the array (low > high). Returns -1`,
      codeLine: 12,
      variables: { result: -1, status: 'Not Found' },
      arrayData: [...arr]
    });
  }

  return steps;
}

export function generateTwoSumSteps(rawInput: string, rawTarget: number): DsaStep[] {
  const arr = parseNumberArray(rawInput, [1, 3, 4, 6, 8, 11, 15]).sort((a, b) => a - b);
  const target = Number(rawTarget) || 14;
  const steps: DsaStep[] = [];

  let left = 0;
  let right = arr.length - 1;
  let stepIdx = 0;

  steps.push({
    stepIndex: stepIdx++,
    description: `Initialize Two Pointers: left = 0 (arr[0] = ${arr[0]}), right = ${right} (arr[${right}] = ${arr[right]}). Target sum = ${target}`,
    codeLine: 2,
    variables: { left, right, target },
    arrayData: [...arr],
    pointers: [
      { index: left, label: 'left', color: 'blue' },
      { index: right, label: 'right', color: 'orange' }
    ]
  });

  let found = false;

  while (left < right) {
    const sum = arr[left] + arr[right];

    steps.push({
      stepIndex: stepIdx++,
      description: `Testing pair arr[${left}] (${arr[left]}) + arr[${right}] (${arr[right]}) = ${sum} (Target: ${target})`,
      codeLine: 5,
      variables: { left, right, sum, target },
      arrayData: [...arr],
      activeIndices: [left, right],
      pointers: [
        { index: left, label: 'left', color: 'blue' },
        { index: right, label: 'right', color: 'orange' }
      ]
    });

    if (sum === target) {
      steps.push({
        stepIndex: stepIdx++,
        description: `Target sum reached! arr[${left}] (${arr[left]}) + arr[${right}] (${arr[right]}) == ${target}`,
        codeLine: 7,
        variables: { solution: `[${left}, ${right}]`, values: `[${arr[left]}, ${arr[right]}]` },
        arrayData: [...arr],
        sortedIndices: [left, right],
        pointers: [
          { index: left, label: 'Pair 1', color: 'emerald' },
          { index: right, label: 'Pair 2', color: 'emerald' }
        ]
      });
      found = true;
      break;
    } else if (sum < target) {
      steps.push({
        stepIndex: stepIdx++,
        description: `Sum ${sum} < ${target} (too small). Since array is sorted, increment left pointer to increase sum.`,
        codeLine: 9,
        variables: { old_left: left, new_left: left + 1 },
        arrayData: [...arr],
        activeIndices: [left],
        pointers: [
          { index: left + 1, label: 'left →', color: 'blue' },
          { index: right, label: 'right', color: 'orange' }
        ]
      });
      left++;
    } else {
      steps.push({
        stepIndex: stepIdx++,
        description: `Sum ${sum} > ${target} (too large). Since array is sorted, decrement right pointer to decrease sum.`,
        codeLine: 11,
        variables: { old_right: right, new_right: right - 1 },
        arrayData: [...arr],
        activeIndices: [right],
        pointers: [
          { index: left, label: 'left', color: 'blue' },
          { index: right - 1, label: '← right', color: 'orange' }
        ]
      });
      right--;
    }
  }

  if (!found) {
    steps.push({
      stepIndex: stepIdx++,
      description: `No two numbers in the array sum to ${target}. Pointers met at left == right.`,
      codeLine: 12,
      variables: { result: 'None' },
      arrayData: [...arr]
    });
  }

  return steps;
}

export function generateSlidingWindowSteps(rawInput: string, rawK: number): DsaStep[] {
  const arr = parseNumberArray(rawInput, [2, 1, 5, 1, 3, 2, 7, 4]);
  const k = Math.max(1, Math.min(Number(rawK) || 3, arr.length));
  const steps: DsaStep[] = [];
  let stepIdx = 0;

  // Initial window
  let windowSum = 0;
  for (let i = 0; i < k; i++) windowSum += arr[i];
  let maxSum = windowSum;

  steps.push({
    stepIndex: stepIdx++,
    description: `Initialize sliding window of size K = ${k}. First window [0..${k - 1}] sum = ${windowSum}`,
    codeLine: 3,
    variables: { k, window_sum: windowSum, max_sum: maxSum },
    arrayData: [...arr],
    activeIndices: Array.from({ length: k }, (_, idx) => idx),
    pointers: [
      { index: 0, label: 'start', color: 'blue' },
      { index: k - 1, label: 'end', color: 'purple' }
    ]
  });

  for (let i = 0; i < arr.length - k; i++) {
    const outgoing = arr[i];
    const incoming = arr[i + k];
    windowSum = windowSum - outgoing + incoming;
    const isNewMax = windowSum > maxSum;
    if (isNewMax) maxSum = windowSum;

    steps.push({
      stepIndex: stepIdx++,
      description: `Slide window right: subtract outgoing arr[${i}] (${outgoing}), add incoming arr[${i + k}] (${incoming}). New sum = ${windowSum}${isNewMax ? ' (New Maximum!)' : ''}`,
      codeLine: 6,
      variables: {
        outgoing_index: i,
        incoming_index: i + k,
        window_sum: windowSum,
        max_sum: maxSum
      },
      arrayData: [...arr],
      activeIndices: Array.from({ length: k }, (_, idx) => i + 1 + idx),
      pointers: [
        { index: i + 1, label: 'start', color: 'blue' },
        { index: i + k, label: 'end', color: 'purple' }
      ]
    });
  }

  steps.push({
    stepIndex: stepIdx++,
    description: `Sliding window complete. Maximum subarray sum of size ${k} is ${maxSum}`,
    codeLine: 8,
    variables: { final_max_sum: maxSum },
    arrayData: [...arr],
    sortedIndices: Array.from({ length: arr.length }, (_, i) => i)
  });

  return steps;
}

export function generateBubbleSortSteps(rawInput: string): DsaStep[] {
  const arr = parseNumberArray(rawInput, [45, 12, 85, 32, 89, 39, 69, 22]);
  const steps: DsaStep[] = [];
  const n = arr.length;
  let stepIdx = 0;
  const sorted: number[] = [];

  steps.push({
    stepIndex: stepIdx++,
    description: `Start Bubble Sort on array of ${n} elements.`,
    codeLine: 2,
    variables: { n },
    arrayData: [...arr]
  });

  for (let i = 0; i < n; i++) {
    let swapped = false;

    for (let j = 0; j < n - i - 1; j++) {
      steps.push({
        stepIndex: stepIdx++,
        description: `Pass ${i + 1}: Compare arr[${j}] (${arr[j]}) and arr[${j + 1}] (${arr[j + 1]})`,
        codeLine: 5,
        variables: { pass: i + 1, 'arr[j]': arr[j], 'arr[j+1]': arr[j + 1] },
        arrayData: [...arr],
        activeIndices: [j, j + 1],
        sortedIndices: [...sorted],
        pointers: [
          { index: j, label: 'j', color: 'blue' },
          { index: j + 1, label: 'j+1', color: 'purple' }
        ]
      });

      if (arr[j] > arr[j + 1]) {
        // Swap
        const temp = arr[j];
        arr[j] = arr[j + 1];
        arr[j + 1] = temp;
        swapped = true;

        steps.push({
          stepIndex: stepIdx++,
          description: `Swap: ${temp} > ${arr[j]}, swapping arr[${j}] and arr[${j + 1}]`,
          codeLine: 7,
          variables: { swapped: true },
          arrayData: [...arr],
          swappedIndices: [j, j + 1],
          sortedIndices: [...sorted],
          pointers: [
            { index: j, label: 'swapped', color: 'rose' },
            { index: j + 1, label: 'swapped', color: 'rose' }
          ]
        });
      }
    }

    sorted.push(n - i - 1);
    steps.push({
      stepIndex: stepIdx++,
      description: `End of Pass ${i + 1}: Element ${arr[n - i - 1]} at index ${n - i - 1} is now in its final sorted position.`,
      codeLine: 8,
      variables: { sorted_element: arr[n - i - 1] },
      arrayData: [...arr],
      sortedIndices: [...sorted]
    });

    if (!swapped) {
      steps.push({
        stepIndex: stepIdx++,
        description: `Early exit: No swaps occurred in pass ${i + 1}. Array is already fully sorted!`,
        codeLine: 10,
        variables: { sorted: true },
        arrayData: [...arr],
        sortedIndices: Array.from({ length: n }, (_, k) => k)
      });
      break;
    }
  }

  return steps;
}

export function generateQuickSortSteps(rawInput: string): DsaStep[] {
  const arr = parseNumberArray(rawInput, [38, 27, 43, 3, 9, 82, 10]);
  const steps: DsaStep[] = [];
  let stepIdx = 0;
  const sorted: number[] = [];

  steps.push({
    stepIndex: stepIdx++,
    description: `Quick Sort started on array [${arr.join(', ')}].`,
    codeLine: 1,
    arrayData: [...arr]
  });

  function partition(low: number, high: number): number {
    const pivot = arr[high];
    let i = low - 1;

    steps.push({
      stepIndex: stepIdx++,
      description: `Partition range [${low}..${high}]: Choose pivot = ${pivot} at index ${high}`,
      codeLine: 2,
      variables: { low, high, pivot },
      arrayData: [...arr],
      activeIndices: [high],
      pointers: [{ index: high, label: `Pivot (${pivot})`, color: 'purple' }]
    });

    for (let j = low; j < high; j++) {
      steps.push({
        stepIndex: stepIdx++,
        description: `Comparing arr[${j}] (${arr[j]}) with pivot (${pivot})`,
        codeLine: 5,
        variables: { j, 'arr[j]': arr[j], pivot, i },
        arrayData: [...arr],
        activeIndices: [j, high],
        pointers: [
          { index: j, label: 'j', color: 'blue' },
          { index: high, label: 'pivot', color: 'purple' }
        ]
      });

      if (arr[j] <= pivot) {
        i++;
        if (i !== j) {
          const temp = arr[i];
          arr[i] = arr[j];
          arr[j] = temp;
          steps.push({
            stepIndex: stepIdx++,
            description: `${arr[i]} <= ${pivot}: increment i to ${i} and swap arr[${i}] with arr[${j}]`,
            codeLine: 7,
            variables: { i, j },
            arrayData: [...arr],
            swappedIndices: [i, j],
            pointers: [
              { index: i, label: 'i', color: 'rose' },
              { index: j, label: 'j', color: 'rose' }
            ]
          });
        }
      }
    }

    // Put pivot in correct place
    const pivotFinal = i + 1;
    const temp = arr[pivotFinal];
    arr[pivotFinal] = arr[high];
    arr[high] = temp;
    sorted.push(pivotFinal);

    steps.push({
      stepIndex: stepIdx++,
      description: `Place pivot ${pivot} into its correct final sorted position at index ${pivotFinal}.`,
      codeLine: 8,
      variables: { pivot_index: pivotFinal },
      arrayData: [...arr],
      swappedIndices: [pivotFinal, high],
      sortedIndices: [...sorted],
      pointers: [{ index: pivotFinal, label: '🎯 Pivot Sorted', color: 'emerald' }]
    });

    return pivotFinal;
  }

  function quickSort(low: number, high: number) {
    if (low < high) {
      const pi = partition(low, high);
      quickSort(low, pi - 1);
      quickSort(pi + 1, high);
    } else if (low === high) {
      if (!sorted.includes(low)) sorted.push(low);
    }
  }

  quickSort(0, arr.length - 1);

  steps.push({
    stepIndex: stepIdx++,
    description: `Quick Sort complete! All elements sorted: [${arr.join(', ')}]`,
    codeLine: 9,
    arrayData: [...arr],
    sortedIndices: Array.from({ length: arr.length }, (_, k) => k)
  });

  return steps;
}

export function generateInsertionSortSteps(rawInput: string): DsaStep[] {
  const arr = parseNumberArray(rawInput, [29, 10, 14, 37, 13]);
  const steps: DsaStep[] = [];
  let stepIdx = 0;
  const sorted: number[] = [0];

  steps.push({
    stepIndex: stepIdx++,
    description: `Start Insertion Sort. Single element arr[0] = ${arr[0]} is trivially sorted.`,
    codeLine: 2,
    arrayData: [...arr],
    sortedIndices: [0]
  });

  for (let i = 1; i < arr.length; i++) {
    const key = arr[i];
    let j = i - 1;

    steps.push({
      stepIndex: stepIdx++,
      description: `Pick key = arr[${i}] (${key}) to insert into sorted prefix arr[0..${i - 1}]`,
      codeLine: 3,
      variables: { key, i },
      arrayData: [...arr],
      activeIndices: [i],
      sortedIndices: [...sorted],
      pointers: [{ index: i, label: `Key (${key})`, color: 'purple' }]
    });

    while (j >= 0 && arr[j] > key) {
      arr[j + 1] = arr[j];
      steps.push({
        stepIndex: stepIdx++,
        description: `arr[${j}] (${arr[j]}) > key (${key}). Shift arr[${j}] right to index ${j + 1}`,
        codeLine: 6,
        variables: { j, 'arr[j]': arr[j], key },
        arrayData: [...arr],
        swappedIndices: [j, j + 1],
        pointers: [
          { index: j, label: 'j', color: 'blue' },
          { index: j + 1, label: 'shift →', color: 'rose' }
        ]
      });
      j--;
    }

    arr[j + 1] = key;
    sorted.push(i);

    steps.push({
      stepIndex: stepIdx++,
      description: `Insert key ${key} at position ${j + 1}. Sorted subarray is now arr[0..${i}]`,
      codeLine: 8,
      variables: { inserted_at: j + 1, key },
      arrayData: [...arr],
      sortedIndices: Array.from({ length: i + 1 }, (_, k) => k),
      pointers: [{ index: j + 1, label: 'Inserted', color: 'emerald' }]
    });
  }

  return steps;
}

// -------------------------------------------------------------
// Trees & BST Steps
// -------------------------------------------------------------

export function generateBstSearchSteps(rawTarget: number): DsaStep[] {
  const target = Number(rawTarget) || 60;
  const steps: DsaStep[] = [];
  let stepIdx = 0;

  // Standard sample BST:
  //         50
  //       /    \
  //     30      70
  //    /  \    /  \
  //   20  40  60  80
  const treeNodes = [
    { id: '50', val: 50, leftId: '30', rightId: '70' },
    { id: '30', val: 30, leftId: '20', rightId: '40' },
    { id: '70', val: 70, leftId: '60', rightId: '80' },
    { id: '20', val: 20, leftId: null, rightId: null },
    { id: '40', val: 40, leftId: null, rightId: null },
    { id: '60', val: 60, leftId: null, rightId: null },
    { id: '80', val: 80, leftId: null, rightId: null }
  ];

  steps.push({
    stepIndex: stepIdx++,
    description: `Begin BST search for target ${target} starting at Root (50).`,
    codeLine: 2,
    variables: { target, current: 50 },
    treeNodes: treeNodes.map(n => ({ ...n, status: n.id === '50' ? 'active' : 'default' }))
  });

  let currId: string | null = '50';
  const visitedPath: string[] = [];

  while (currId) {
    const node = treeNodes.find(n => n.id === currId);
    if (!node) break;

    visitedPath.push(node.id);

    steps.push({
      stepIndex: stepIdx++,
      description: `Comparing target (${target}) with current node (${node.val}).`,
      codeLine: 4,
      variables: { 'node.val': node.val, target },
      treeNodes: treeNodes.map(n => ({
        ...n,
        status: n.id === node.id ? 'active' : visitedPath.includes(n.id) ? 'path' : 'default'
      }))
    });

    if (node.val === target) {
      steps.push({
        stepIndex: stepIdx++,
        description: `Target ${target} found in BST! (curr.val == ${target})`,
        codeLine: 5,
        variables: { result: 'Node Found', val: target },
        treeNodes: treeNodes.map(n => ({
          ...n,
          status: n.id === node.id ? 'target' : visitedPath.includes(n.id) ? 'path' : 'default'
        }))
      });
      return steps;
    } else if (target < node.val) {
      steps.push({
        stepIndex: stepIdx++,
        description: `target (${target}) < node.val (${node.val}). Move to left child.`,
        codeLine: 7,
        variables: { next: node.leftId || 'None' },
        treeNodes: treeNodes.map(n => ({
          ...n,
          status: n.id === node.id ? 'visited' : visitedPath.includes(n.id) ? 'path' : 'default'
        }))
      });
      currId = node.leftId || null;
    } else {
      steps.push({
        stepIndex: stepIdx++,
        description: `target (${target}) > node.val (${node.val}). Move to right child.`,
        codeLine: 9,
        variables: { next: node.rightId || 'None' },
        treeNodes: treeNodes.map(n => ({
          ...n,
          status: n.id === node.id ? 'visited' : visitedPath.includes(n.id) ? 'path' : 'default'
        }))
      });
      currId = node.rightId || null;
    }
  }

  steps.push({
    stepIndex: stepIdx++,
    description: `Reached null child. Target ${target} does not exist in the BST.`,
    codeLine: 10,
    variables: { result: 'Not Found' },
    treeNodes: treeNodes.map(n => ({
      ...n,
      status: visitedPath.includes(n.id) ? 'visited' : 'default'
    }))
  });

  return steps;
}

export function generateTreeInorderSteps(): DsaStep[] {
  const steps: DsaStep[] = [];
  let stepIdx = 0;

  const treeNodes = [
    { id: '40', val: 40, leftId: '20', rightId: '60' },
    { id: '20', val: 20, leftId: '10', rightId: '30' },
    { id: '60', val: 60, leftId: '50', rightId: '70' },
    { id: '10', val: 10, leftId: null, rightId: null },
    { id: '30', val: 30, leftId: null, rightId: null },
    { id: '50', val: 50, leftId: null, rightId: null },
    { id: '70', val: 70, leftId: null, rightId: null }
  ];

  const inOrderSequence = ['10', '20', '30', '40', '50', '60', '70'];
  const output: number[] = [];

  steps.push({
    stepIndex: stepIdx++,
    description: 'Begin In-Order Traversal (Left Subtree -> Root -> Right Subtree).',
    codeLine: 2,
    treeNodes: treeNodes.map(n => ({ ...n, status: 'default' })),
    traversalOutput: []
  });

  for (const nodeId of inOrderSequence) {
    const node = treeNodes.find(n => n.id === nodeId)!;
    output.push(node.val);

    steps.push({
      stepIndex: stepIdx++,
      description: `Visit node (${node.val}). Append to sorted result list.`,
      codeLine: 6,
      variables: { current: node.val, output: `[${output.join(', ')}]` },
      treeNodes: treeNodes.map(n => ({
        ...n,
        status: n.id === nodeId ? 'active' : output.includes(n.val) ? 'visited' : 'default'
      })),
      traversalOutput: [...output]
    });
  }

  steps.push({
    stepIndex: stepIdx++,
    description: `In-Order Traversal Complete! Output: [${output.join(', ')}]`,
    codeLine: 8,
    treeNodes: treeNodes.map(n => ({ ...n, status: 'visited' })),
    traversalOutput: [...output]
  });

  return steps;
}

// -------------------------------------------------------------
// Linked Lists Steps
// -------------------------------------------------------------

export function generateReverseLinkedListSteps(rawInput: string): DsaStep[] {
  const values = parseNumberArray(rawInput, [1, 2, 3, 4, 5]);
  const steps: DsaStep[] = [];
  let stepIdx = 0;

  const nodes = values.map((val, idx) => ({
    id: `node_${idx}`,
    val,
    nextId: idx < values.length - 1 ? `node_${idx + 1}` : null,
    isReversed: false
  }));

  steps.push({
    stepIndex: stepIdx++,
    description: 'Initialize Reverse Linked List: prev = None, curr = Head',
    codeLine: 2,
    variables: { prev: 'None', curr: values[0] },
    listNodes: nodes.map(n => ({ ...n, status: n.id === 'node_0' ? 'active' : 'default' })),
    listPointers: [
      { nodeId: 'node_0', label: 'curr (Head)', color: 'blue' }
    ]
  });

  let prevNodeId: string | null = null;
  let currIndex = 0;

  while (currIndex < nodes.length) {
    const currNode = nodes[currIndex];
    const nextNodeId = currIndex < nodes.length - 1 ? `node_${currIndex + 1}` : 'None';

    steps.push({
      stepIndex: stepIdx++,
      description: `Save next pointer: next_temp = curr.next (${nextNodeId})`,
      codeLine: 5,
      variables: { curr: currNode.val, next_temp: nextNodeId, prev: prevNodeId || 'None' },
      listNodes: nodes.map((n, idx) => ({
        ...n,
        status: idx === currIndex ? 'active' : idx < currIndex ? 'visited' : 'default'
      })),
      listPointers: [
        { nodeId: currNode.id, label: 'curr', color: 'blue' },
        ...(prevNodeId ? [{ nodeId: prevNodeId, label: 'prev', color: 'purple' }] : [])
      ]
    });

    // Reverse pointer
    currNode.isReversed = true;

    steps.push({
      stepIndex: stepIdx++,
      description: `Reverse link: curr.next = prev (points back to ${prevNodeId || 'None'}). Move prev = curr, curr = next`,
      codeLine: 6,
      variables: { reversed_node: currNode.val },
      listNodes: nodes.map((n, idx) => ({
        ...n,
        status: idx <= currIndex ? 'visited' : 'default'
      })),
      listPointers: [
        { nodeId: currNode.id, label: 'prev', color: 'purple' },
        ...(currIndex < nodes.length - 1 ? [{ nodeId: `node_${currIndex + 1}`, label: 'curr', color: 'blue' }] : [])
      ]
    });

    prevNodeId = currNode.id;
    currIndex++;
  }

  steps.push({
    stepIndex: stepIdx++,
    description: `Reversal complete! New head of linked list is node (${values[values.length - 1]}).`,
    codeLine: 9,
    variables: { new_head: values[values.length - 1] },
    listNodes: nodes.map(n => ({ ...n, status: 'visited', isReversed: true })),
    listPointers: [
      { nodeId: `node_${values.length - 1}`, label: 'Head', color: 'emerald' }
    ]
  });

  return steps;
}

export function generateFloydCycleSteps(): DsaStep[] {
  const steps: DsaStep[] = [];
  let stepIdx = 0;

  const nodeVals = [10, 20, 30, 40, 50, 60];
  // Cycle connects node 60 back to node 30 (index 2)
  const nodes = nodeVals.map((val, idx) => ({
    id: `n_${idx}`,
    val,
    nextId: idx < nodeVals.length - 1 ? `n_${idx + 1}` : 'n_2',
    isReversed: false
  }));

  steps.push({
    stepIndex: stepIdx++,
    description: "Start Floyd's Cycle Detection: slow = head, fast = head. Tail (60) connects to node 30 forming a cycle.",
    codeLine: 2,
    variables: { slow: 10, fast: 10 },
    listNodes: nodes.map(n => ({ ...n, status: 'default' })),
    listPointers: [
      { nodeId: 'n_0', label: 'slow & fast', color: 'blue' }
    ]
  });

  let slowIdx = 0;
  let fastIdx = 0;

  const nextIndex = (idx: number) => {
    if (idx < 5) return idx + 1;
    return 2; // cycle to node 30
  };

  for (let round = 1; round <= 7; round++) {
    slowIdx = nextIndex(slowIdx);
    fastIdx = nextIndex(nextIndex(fastIdx));

    const isMatch = slowIdx === fastIdx;

    steps.push({
      stepIndex: stepIdx++,
      description: `Step ${round}: Slow advances 1 step to (${nodes[slowIdx].val}), Fast advances 2 steps to (${nodes[fastIdx].val}).`,
      codeLine: 6,
      variables: { slow: nodes[slowIdx].val, fast: nodes[fastIdx].val, match: isMatch },
      listNodes: nodes.map(n => ({
        ...n,
        status: isMatch && n.id === nodes[slowIdx].id ? 'target' : 'default'
      })),
      listPointers: isMatch ? [
        { nodeId: nodes[slowIdx].id, label: '🎯 CYCLE DETECTED (slow == fast)', color: 'emerald' }
      ] : [
        { nodeId: nodes[slowIdx].id, label: 'slow (1x)', color: 'blue' },
        { nodeId: nodes[fastIdx].id, label: 'fast (2x)', color: 'purple' }
      ]
    });

    if (isMatch) break;
  }

  return steps;
}

// -------------------------------------------------------------
// Stacks & Valid Parentheses Steps
// -------------------------------------------------------------

export function generateValidParenthesesSteps(rawInput: string): DsaStep[] {
  const s = rawInput.trim() || '{[()]}';
  const chars = s.replace(/\s+/g, '').split('');
  const steps: DsaStep[] = [];
  let stepIdx = 0;

  const stack: string[] = [];
  const pairs: Record<string, string> = { ')': '(', '}': '{', ']': '[' };

  steps.push({
    stepIndex: stepIdx++,
    description: `Evaluate bracket string: "${chars.join('')}". Initial stack is empty.`,
    codeLine: 2,
    variables: { string: chars.join(''), stack_size: 0 },
    stackItems: []
  });

  let isValid = true;

  for (let i = 0; i < chars.length; i++) {
    const char = chars[i];

    if (char === '(' || char === '{' || char === '[') {
      stack.push(char);
      steps.push({
        stepIndex: stepIdx++,
        description: `Character '${char}' is an opening bracket. Push onto stack.`,
        codeLine: 10,
        variables: { current_char: char, action: 'PUSH' },
        stackItems: [...stack],
        currentCharIndex: i
      });
    } else if (char in pairs) {
      const top = stack.length > 0 ? stack[stack.length - 1] : null;
      if (top === pairs[char]) {
        stack.pop();
        steps.push({
          stepIndex: stepIdx++,
          description: `Character '${char}' matches opening bracket '${top}' on top of stack. Pop stack!`,
          codeLine: 7,
          variables: { current_char: char, matched_top: top, action: 'POP' },
          stackItems: [...stack],
          currentCharIndex: i
        });
      } else {
        steps.push({
          stepIndex: stepIdx++,
          description: `Mismatch: '${char}' does not match stack top '${top || 'empty'}'. Invalid sequence!`,
          codeLine: 8,
          variables: { current_char: char, expected: pairs[char], found: top || 'empty' },
          stackItems: [...stack],
          currentCharIndex: i
        });
        isValid = false;
        break;
      }
    }
  }

  if (isValid && stack.length === 0) {
    steps.push({
      stepIndex: stepIdx++,
      description: 'All brackets matched and stack is empty. String is VALID! (return True)',
      codeLine: 11,
      variables: { valid: true },
      stackItems: []
    });
  } else if (isValid && stack.length > 0) {
    steps.push({
      stepIndex: stepIdx++,
      description: `Unclosed brackets remaining on stack: [${stack.join(', ')}]. String is INVALID!`,
      codeLine: 11,
      variables: { valid: false, unclosed: stack.join(', ') },
      stackItems: [...stack]
    });
  }

  return steps;
}

// -------------------------------------------------------------
// Graphs: BFS Steps
// -------------------------------------------------------------

export function generateBfsGraphSteps(): DsaStep[] {
  const steps: DsaStep[] = [];
  let stepIdx = 0;

  // Graph vertices: A, B, C, D, E, F
  // Edges: A->B, A->C, B->D, B->E, C->F
  const nodes = [
    { id: 'A', label: 'A' },
    { id: 'B', label: 'B' },
    { id: 'C', label: 'C' },
    { id: 'D', label: 'D' },
    { id: 'E', label: 'E' },
    { id: 'F', label: 'F' }
  ];

  const edges = [
    { from: 'A', to: 'B' },
    { from: 'A', to: 'C' },
    { from: 'B', to: 'D' },
    { from: 'B', to: 'E' },
    { from: 'C', to: 'F' }
  ];

  const graph: Record<string, string[]> = {
    A: ['B', 'C'],
    B: ['D', 'E'],
    C: ['F'],
    D: [],
    E: [],
    F: []
  };

  const queue: string[] = ['A'];
  const visited: string[] = ['A'];
  const traversal: string[] = [];

  steps.push({
    stepIndex: stepIdx++,
    description: 'Start BFS traversal at node A. Add A to queue and visited set.',
    codeLine: 3,
    variables: { queue: '[A]', visited: '{A}' },
    queueItems: [...queue],
    traversalOutput: [],
    graphNodes: nodes.map(n => ({
      ...n,
      status: n.id === 'A' ? 'queue' : 'unvisited'
    })),
    graphEdges: edges.map(e => ({ ...e, active: false }))
  });

  while (queue.length > 0) {
    const current = queue.shift()!;
    traversal.push(current);

    steps.push({
      stepIndex: stepIdx++,
      description: `Dequeue node (${current}) from front of queue. Exploring its neighbors.`,
      codeLine: 7,
      variables: { current, queue: `[${queue.join(', ')}]`, traversal: `[${traversal.join(', ')}]` },
      queueItems: [...queue],
      traversalOutput: [...traversal],
      graphNodes: nodes.map(n => ({
        ...n,
        status: n.id === current ? 'active' : visited.includes(n.id) ? 'visited' : queue.includes(n.id) ? 'queue' : 'unvisited'
      })),
      graphEdges: edges.map(e => ({ ...e, active: e.from === current }))
    });

    for (const neighbor of graph[current]) {
      if (!visited.includes(neighbor)) {
        visited.push(neighbor);
        queue.push(neighbor);

        steps.push({
          stepIndex: stepIdx++,
          description: `Discovered unvisited neighbor (${neighbor}) from (${current}). Enqueue (${neighbor}).`,
          codeLine: 12,
          variables: { neighbor, queue: `[${queue.join(', ')}]` },
          queueItems: [...queue],
          traversalOutput: [...traversal],
          graphNodes: nodes.map(n => ({
            ...n,
            status: n.id === neighbor ? 'queue' : n.id === current ? 'active' : visited.includes(n.id) ? 'visited' : 'unvisited'
          })),
          graphEdges: edges.map(e => ({ ...e, active: (e.from === current && e.to === neighbor) }))
        });
      }
    }
  }

  steps.push({
    stepIndex: stepIdx++,
    description: `BFS complete! All reachable vertices visited: [${traversal.join(', ')}]`,
    codeLine: 13,
    queueItems: [],
    traversalOutput: [...traversal],
    graphNodes: nodes.map(n => ({ ...n, status: 'visited' })),
    graphEdges: edges.map(e => ({ ...e, active: false }))
  });

  return steps;
}
