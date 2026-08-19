import { useState } from 'react';

const SYNTAX_CATEGORIES = [
  'Hash Maps & Sets',
  'Heaps & Priority Queues',
  'Sorting & Comparators',
  '2D Arrays & DP Tables',
  'Stacks & Deques',
  'Binary Search Built-ins',
  'Strings & Chars',
];

const SYNTAX_DATABASE = {
  'Hash Maps & Sets': [
    {
      title: 'Initialize Map',
      python: 'seen = {}  # or seen = defaultdict(int)',
      java: 'Map<Integer, Integer> map = new HashMap<>();',
      cpp: 'unordered_map<int, int> map;',
      javascript: 'const map = new Map();',
    },
    {
      title: 'Get with Default Value',
      python: 'count = seen.get(key, 0)',
      java: 'int count = map.getOrDefault(key, 0);',
      cpp: 'int count = map.count(key) ? map[key] : 0;',
      javascript: 'const count = map.get(key) ?? 0;',
    },
    {
      title: 'Check Key Exists',
      python: 'if key in seen:',
      java: 'if (map.containsKey(key)) { }',
      cpp: 'if (map.find(key) != map.end()) { }',
      javascript: 'if (map.has(key)) { }',
    },
    {
      title: 'Initialize Set',
      python: 'visited = set()',
      java: 'Set<Integer> visited = new HashSet<>();',
      cpp: 'unordered_set<int> visited;',
      javascript: 'const visited = new Set();',
    },
  ],
  'Heaps & Priority Queues': [
    {
      title: 'Min Heap',
      python: 'import heapq\nh = []\nheapq.heappush(h, val)\nmin_val = heapq.heappop(h)',
      java: 'PriorityQueue<Integer> pq = new PriorityQueue<>();\npq.offer(val);\nint minVal = pq.poll();',
      cpp: '#include <queue>\npriority_queue<int, vector<int>, greater<int>> pq;\npq.push(val);\nint minVal = pq.top(); pq.pop();',
      javascript: '// Custom MinHeap or binary heap\nclass MinHeap { ... }\nconst pq = new MinHeap();',
    },
    {
      title: 'Max Heap',
      python: '# Push negated values\nheapq.heappush(h, -val)\nmax_val = -heapq.heappop(h)',
      java: 'PriorityQueue<Integer> maxPq = new PriorityQueue<>(Collections.reverseOrder());\nmaxPq.offer(val);',
      cpp: 'priority_queue<int> maxPq; // Max heap by default\nmaxPq.push(val);\nint maxVal = maxPq.top(); maxPq.pop();',
      javascript: '// Store negated values in standard min-heap or MaxHeap class',
    },
    {
      title: 'Heap with Custom Pair / Object (by frequency)',
      python: '# heapq sorts by 1st tuple element\nheapq.heappush(h, (freq, val))',
      java: 'PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> a[0] - b[0]);\npq.offer(new int[]{freq, val});',
      cpp: 'auto comp = [](const pair<int,int>& a, const pair<int,int>& b) { return a.first > b.first; };\npriority_queue<pair<int,int>, vector<pair<int,int>>, decltype(comp)> pq(comp);',
      javascript: 'pq.push({ freq, val }, (a, b) => a.freq - b.freq);',
    },
  ],
  'Sorting & Comparators': [
    {
      title: 'Sort Array in Ascending Order',
      python: 'nums.sort()  # or sorted_nums = sorted(nums)',
      java: 'Arrays.sort(nums); // or Collections.sort(list);',
      cpp: 'sort(nums.begin(), nums.end());',
      javascript: 'nums.sort((a, b) => a - b);',
    },
    {
      title: 'Sort Array in Descending Order',
      python: 'nums.sort(reverse=True)',
      java: '// For object arrays\nArrays.sort(nums, Collections.reverseOrder());',
      cpp: 'sort(nums.begin(), nums.end(), greater<int>());',
      javascript: 'nums.sort((a, b) => b - a);',
    },
    {
      title: 'Sort 2D Array / Intervals by Start Time',
      python: 'intervals.sort(key=lambda x: x[0])',
      java: 'Arrays.sort(intervals, (a, b) -> Integer.compare(a[0], b[0]));',
      cpp: 'sort(intervals.begin(), intervals.end(), [](const vector<int>& a, const vector<int>& b) {\n    return a[0] < b[0];\n});',
      javascript: 'intervals.sort((a, b) => a[0] - b[0]);',
    },
  ],
  '2D Arrays & DP Tables': [
    {
      title: 'Initialize N x M DP Matrix with 0',
      python: 'dp = [[0] * m for _ in range(n)]',
      java: 'int[][] dp = new int[n][m];',
      cpp: 'vector<vector<int>> dp(n, vector<int>(m, 0));',
      javascript: 'const dp = Array.from({ length: n }, () => new Array(m).fill(0));',
    },
    {
      title: 'Initialize N x M Matrix with Infinity / Large Value',
      python: 'dp = [[float("inf")] * m for _ in range(n)]',
      java: 'int[][] dp = new int[n][m];\nfor (int[] row : dp) Arrays.fill(row, Integer.MAX_VALUE / 2);',
      cpp: 'vector<vector<int>> dp(n, vector<int>(m, 1e9));',
      javascript: 'const dp = Array.from({ length: n }, () => new Array(m).fill(Infinity));',
    },
    {
      title: '4-Directional Grid Moves (Up, Right, Down, Left)',
      python: 'dirs = [(-1, 0), (0, 1), (1, 0), (0, -1)]\nfor dr, dc in dirs:\n    nr, nc = r + dr, c + dc\n    if 0 <= nr < n and 0 <= nc < m:\n        pass',
      java: 'int[][] dirs = {{-1, 0}, {0, 1}, {1, 0}, {0, -1}};\nfor (int[] d : dirs) {\n    int nr = r + d[0], nc = c + d[1];\n    if (nr >= 0 && nr < n && nc >= 0 && nc < m) { }\n}',
      cpp: 'int dirs[4][2] = {{-1, 0}, {0, 1}, {1, 0}, {0, -1}};\nfor (auto& d : dirs) {\n    int nr = r + d[0], nc = c + d[1];\n    if (nr >= 0 && nr < n && nc >= 0 && nc < m) { }\n}',
      javascript: 'const dirs = [[-1, 0], [0, 1], [1, 0], [0, -1]];\nfor (const [dr, dc] of dirs) {\n    const nr = r + dr, nc = c + dc;\n    if (nr >= 0 && nr < n && nc >= 0 && nc < m) { }\n}',
    },
  ],
  'Stacks & Deques': [
    {
      title: 'Double-Ended Queue (Deque)',
      python: 'from collections import deque\nq = deque()\nq.append(x)      # push right\nq.appendleft(x)  # push left\nx = q.pop()      # pop right\nx = q.popleft()  # pop left',
      java: 'Deque<Integer> dq = new ArrayDeque<>();\ndq.offerLast(x);\ndq.offerFirst(x);\nint r = dq.pollLast();\nint l = dq.pollFirst();',
      cpp: '#include <deque>\ndeque<int> dq;\ndq.push_back(x);\ndq.push_front(x);\ndq.pop_back();\ndq.pop_front();',
      javascript: 'const dq = [];\ndq.push(x);    // push right\ndq.unshift(x); // push left\ndq.pop();      // pop right\ndq.shift();    // pop left',
    },
    {
      title: 'Monotonic Stack Template (Next Greater Element)',
      python: 'stack = []  # stores indices\nfor i, num in enumerate(nums):\n    while stack and nums[stack[-1]] < num:\n        idx = stack.pop()\n        res[idx] = num\n    stack.append(i)',
      java: 'Deque<Integer> stack = new ArrayDeque<>();\nfor (int i = 0; i < nums.length; i++) {\n    while (!stack.isEmpty() && nums[stack.peek()] < nums[i]) {\n        int idx = stack.pop();\n        res[idx] = nums[i];\n    }\n    stack.push(i);\n}',
      cpp: 'stack<int> st;\nfor (int i = 0; i < nums.size(); ++i) {\n    while (!st.empty() && nums[st.top()] < nums[i]) {\n        int idx = st.top(); st.pop();\n        res[idx] = nums[i];\n    }\n    st.push(i);\n}',
      javascript: 'const stack = [];\nfor (let i = 0; i < nums.length; i++) {\n  while (stack.length && nums[stack[stack.length - 1]] < nums[i]) {\n    const idx = stack.pop();\n    res[idx] = nums[i];\n  }\n  stack.push(i);\n}',
    },
  ],
  'Binary Search Built-ins': [
    {
      title: 'Find Index (or Insertion Point)',
      python: 'import bisect\nidx_left = bisect.bisect_left(nums, target)   # >= target\nidx_right = bisect.bisect_right(nums, target) # > target',
      java: 'int idx = Arrays.binarySearch(nums, target);\n// if not found, returns (-(insertion point) - 1)',
      cpp: 'auto it1 = lower_bound(nums.begin(), nums.end(), target); // >= target\nauto it2 = upper_bound(nums.begin(), nums.end(), target); // > target\nint idx = distance(nums.begin(), it1);',
      javascript: '// Custom binary search template\nlet l = 0, r = nums.length - 1;\nwhile (l <= r) {\n  const mid = l + Math.floor((r - l) / 2);\n  if (nums[mid] === target) return mid;\n  if (nums[mid] < target) l = mid + 1;\n  else r = mid - 1;\n}',
    },
  ],
  'Strings & Chars': [
    {
      title: 'Char Frequency Array (ASCII 26 lower)',
      python: 'freq = [0] * 26\nfor ch in s:\n    freq[ord(ch) - ord("a")] += 1',
      java: 'int[] freq = new int[26];\nfor (char ch : s.toCharArray()) {\n    freq[ch - "a"]++;\n}',
      cpp: 'int freq[26] = {0};\nfor (char ch : s) {\n    freq[ch - "a"]++;\n}',
      javascript: 'const freq = new Array(26).fill(0);\nfor (const ch of s) {\n  freq[ch.charCodeAt(0) - 97]++;\n}',
    },
  ],
};

const CONSTRAINT_TIERS = [
  {
    range: 'N <= 10 to 20',
    allowedComplexity: 'O(2^N) or O(N!)',
    timeLimitOps: '10^6 to 10^7 ops',
    patterns: 'Backtracking, Exhaustive Search, Permutations, Subsets, Bitmask DP',
    status: 'Exponential approaches will easily pass within 1.0s limit.',
  },
  {
    range: 'N <= 100 to 500',
    allowedComplexity: 'O(N^3) or O(N^4)',
    timeLimitOps: '10^6 to 10^8 ops',
    patterns: 'Floyd-Warshall (All Pairs Shortest Path), 3-State DP, Matrix Multiplication',
    status: 'Cubic algorithms will pass without TLE.',
  },
  {
    range: 'N <= 2,000 to 5,000',
    allowedComplexity: 'O(N^2)',
    timeLimitOps: '10^7 to 2.5 * 10^7 ops',
    patterns: '2D Dynamic Programming (LCS, Edit Distance), Nested Loops, All Pairs Comparison',
    status: 'Quadratic algorithms pass; cubic algorithms will TLE.',
  },
  {
    range: 'N <= 10^5 to 10^6',
    allowedComplexity: 'O(N log N) or O(N)',
    timeLimitOps: '10^7 to 10^8 ops',
    patterns: 'Two Pointers, Sliding Window, Monotonic Stack, Heap, Binary Search, Sorting, BFS/DFS, Disjoint Set Union (DSU)',
    status: 'O(N^2) will TLE (10^10 ops). Target O(N log N) or linear O(N).',
  },
  {
    range: 'N >= 10^9',
    allowedComplexity: 'O(log N) or O(1)',
    timeLimitOps: '< 100 ops',
    patterns: 'Binary Search on Answer, Mathematical Formulas, Fast Matrix Exponentiation, Bit Manipulation',
    status: 'Linear O(N) will TLE (10^9 ops). Requires logarithmic or constant time.',
  },
];

const DECISION_TREE_QUESTIONS = [
  {
    id: 'sorted',
    question: 'Is the input array or sequence already sorted (or can it be sorted in O(N log N))?',
    options: [
      { text: 'Yes, it is sorted', next: 'pair_target' },
      { text: 'No, order must be preserved or sorting is too slow', next: 'contiguous' },
    ],
  },
  {
    id: 'pair_target',
    question: 'Are you searching for a specific pair/triplet sum or a monotonic boundary?',
    options: [
      { text: 'Finding pair/triplet sums', recommendation: 'Two Pointers (Left and Right converging inwards)', pattern: 'Two Pointers', complexity: 'Time: O(N), Space: O(1)' },
      { text: 'Searching for target / optimal threshold', recommendation: 'Binary Search (on index or on Answer space)', pattern: 'Binary Search', complexity: 'Time: O(log N), Space: O(1)' },
    ],
  },
  {
    id: 'contiguous',
    question: 'Does the problem ask for a contiguous subarray, substring, or window under length/sum bounds?',
    options: [
      { text: 'Yes, contiguous subarray/substring', recommendation: 'Sliding Window (Expand R pointer, conditionally shrink L pointer)', pattern: 'Sliding Window', complexity: 'Time: O(N), Space: O(K)' },
      { text: 'No, non-contiguous or global subproblems', next: 'element_relation' },
    ],
  },
  {
    id: 'element_relation',
    question: 'Are you asked to find the Next Greater/Smaller element, Histogram max area, or Bracket matching?',
    options: [
      { text: 'Yes, finding nearest greater/smaller or histogram', recommendation: 'Monotonic Stack (Ascending or Descending stack)', pattern: 'Stack & Monotonic Stack', complexity: 'Time: O(N), Space: O(N)' },
      { text: 'No, optimal value (Min/Max cost, ways to reach state)', next: 'subproblems' },
    ],
  },
  {
    id: 'subproblems',
    question: 'Can the problem be broken down into overlapping subproblems where the optimal choice depends on previous states?',
    options: [
      { text: 'Yes, overlapping subproblems (e.g. Knapsack, Longest Common Subsequence)', recommendation: 'Dynamic Programming (Tabulation or Memoization)', pattern: 'Dynamic Programming', complexity: 'Time: O(N * M), Space: O(N * M)' },
      { text: 'Need continuous Top K elements / Min-Max queries', recommendation: 'Heap / Priority Queue', pattern: 'Heap & Priority Queue', complexity: 'Time: O(N log K), Space: O(K)' },
    ],
  },
];

export default function DsaStudentToolkit({ onClose }) {
  const [activeTab, setActiveTab] = useState('syntax'); // 'syntax' | 'calculator' | 'decision'
  const [activeLang, setActiveLang] = useState('python'); // 'python' | 'java' | 'cpp' | 'javascript'
  const [activeCategory, setActiveCategory] = useState('Hash Maps & Sets');
  const [copiedSnippet, setCopiedSnippet] = useState('');

  // Decision Tree state
  const [currentQuestionId, setCurrentQuestionId] = useState('sorted');
  const [decisionHistory, setDecisionHistory] = useState([]);
  const [finalRecommendation, setFinalRecommendation] = useState(null);

  // Constraint Calculator state
  const [selectedConstraintIdx, setSelectedConstraintIdx] = useState(3); // default N <= 10^5

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(text);
    setTimeout(() => setCopiedSnippet(''), 1800);
  };

  const handleOptionSelect = (option) => {
    if (option.recommendation) {
      setFinalRecommendation(option);
    } else if (option.next) {
      setDecisionHistory((prev) => [...prev, currentQuestionId]);
      setCurrentQuestionId(option.next);
    }
  };

  const handleResetDecision = () => {
    setCurrentQuestionId('sorted');
    setDecisionHistory([]);
    setFinalRecommendation(null);
  };

  const currentQuestion = DECISION_TREE_QUESTIONS.find((q) => q.id === currentQuestionId);

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden transition-colors">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-5 py-3.5">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">DSA Student Mastery Toolkit</h2>
          <p className="text-xs text-slate-600 dark:text-slate-400">Syntax quick-lookup, constraint calculator, and pattern decision tree.</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex rounded-lg bg-white dark:bg-slate-900 p-1 border border-slate-200 dark:border-slate-800 shadow-sm">
          <button
            type="button"
            onClick={() => setActiveTab('syntax')}
            className={`rounded px-3 py-1 text-xs font-semibold transition-colors ${
              activeTab === 'syntax' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            4-Lang Syntax Sheet
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('calculator')}
            className={`rounded px-3 py-1 text-xs font-semibold transition-colors ${
              activeTab === 'calculator' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Big-O Constraint Advisor
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('decision')}
            className={`rounded px-3 py-1 text-xs font-semibold transition-colors ${
              activeTab === 'decision' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Pattern Decision Tree
          </button>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          >
            Close
          </button>
        )}
      </div>

      {/* TAB 1: 4-LANGUAGE SYNTAX CHEAT SHEET */}
      {activeTab === 'syntax' && (
        <div className="p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Language Selector */}
            <div className="flex rounded-lg bg-slate-100 dark:bg-slate-950 p-1 border border-slate-200 dark:border-slate-800">
              {[
                { id: 'python', label: 'Python 3' },
                { id: 'java', label: 'Java' },
                { id: 'cpp', label: 'C++' },
                { id: 'javascript', label: 'JavaScript' },
              ].map((lang) => (
                <button
                  key={lang.id}
                  type="button"
                  onClick={() => setActiveLang(lang.id)}
                  className={`rounded px-3 py-1 text-xs font-semibold transition-colors ${
                    activeLang === lang.id ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-1.5">
              {SYNTAX_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors border ${
                    activeCategory === cat
                      ? 'bg-blue-50 dark:bg-blue-600/20 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-500/40 font-semibold'
                      : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Code Snippets List */}
          <div className="grid gap-3 sm:grid-cols-2">
            {(SYNTAX_DATABASE[activeCategory] || []).map((item, idx) => {
              const codeSnippet = item[activeLang] || '';
              const isCopied = copiedSnippet === codeSnippet;

              return (
                <div
                  key={`syntax-${idx}`}
                  className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3.5 space-y-2 flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-900 dark:text-slate-200">{item.title}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(codeSnippet)}
                      className="rounded bg-slate-200 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700"
                    >
                      {isCopied ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <pre className="overflow-x-auto rounded bg-white dark:bg-slate-900/90 p-2.5 font-mono text-[11px] text-blue-700 dark:text-blue-300 leading-relaxed border border-slate-200 dark:border-slate-800/80">
                    <code>{codeSnippet}</code>
                  </pre>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: BIG-O CONSTRAINT CALCULATOR */}
      {activeTab === 'calculator' && (
        <div className="p-5 space-y-4">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-300">
              Input Size (N) to Allowed Time Complexity
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              Online judges allow roughly <strong>10^8 operations per second</strong>.
            </p>
          </div>

          {/* Quick Select Buttons */}
          <div className="grid gap-2 sm:grid-cols-5">
            {CONSTRAINT_TIERS.map((tier, index) => (
              <button
                key={tier.range}
                type="button"
                onClick={() => setSelectedConstraintIdx(index)}
                className={`rounded-lg p-3 text-left border transition-colors ${
                  selectedConstraintIdx === index
                    ? 'bg-blue-50 dark:bg-blue-600/15 border-blue-400 dark:border-blue-500 text-slate-900 dark:text-white shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="font-mono text-xs font-bold text-blue-700 dark:text-blue-300">{tier.range}</div>
                <div className="text-[11px] text-slate-700 dark:text-slate-300 mt-1 font-semibold">{tier.allowedComplexity}</div>
              </button>
            ))}
          </div>

          {/* Selected Tier Breakdown */}
          {CONSTRAINT_TIERS[selectedConstraintIdx] && (
            <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4 space-y-3">
              <div className="grid gap-3 sm:grid-cols-2 text-xs">
                <div className="space-y-1">
                  <span className="font-semibold text-slate-500 dark:text-slate-400 uppercase text-[10px]">Target Time Complexity</span>
                  <p className="font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    {CONSTRAINT_TIERS[selectedConstraintIdx].allowedComplexity}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="font-semibold text-slate-500 dark:text-slate-400 uppercase text-[10px]">Approximate Operations Budget</span>
                  <p className="font-mono text-sm font-bold text-blue-700 dark:text-blue-300">
                    {CONSTRAINT_TIERS[selectedConstraintIdx].timeLimitOps}
                  </p>
                </div>
              </div>

              <div className="space-y-1 border-t border-slate-200 dark:border-slate-800 pt-3 text-xs">
                <span className="font-semibold text-slate-500 dark:text-slate-400 uppercase text-[10px]">Recommended Algorithmic Patterns</span>
                <p className="text-slate-800 dark:text-slate-200 leading-relaxed">
                  {CONSTRAINT_TIERS[selectedConstraintIdx].patterns}
                </p>
              </div>

              <div className="rounded bg-white dark:bg-slate-900 p-2.5 text-xs text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800">
                <strong>Verdict:</strong> {CONSTRAINT_TIERS[selectedConstraintIdx].status}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: PATTERN RECOGNITION DECISION TREE */}
      {activeTab === 'decision' && (
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-300">
                Pattern Recognition Decision Wizard
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Answer guided questions to pinpoint the exact algorithmic pattern to solve your problem.
              </p>
            </div>
            {(decisionHistory.length > 0 || finalRecommendation) && (
              <button
                type="button"
                onClick={handleResetDecision}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
              >
                Restart Wizard
              </button>
            )}
          </div>

          {finalRecommendation ? (
            /* Recommendation Result */
            <div className="rounded-lg border border-emerald-300 dark:border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/20 p-5 space-y-3">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                <span className="text-xs font-bold uppercase tracking-wider">Recommended Pattern:</span>
              </div>
              <h4 className="text-lg font-bold text-slate-900 dark:text-white">{finalRecommendation.pattern}</h4>
              <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
                {finalRecommendation.recommendation}
              </p>
              <div className="font-mono text-xs text-emerald-700 dark:text-emerald-300 pt-2 border-t border-emerald-200 dark:border-emerald-900/40">
                {finalRecommendation.complexity}
              </div>
              <button
                type="button"
                onClick={handleResetDecision}
                className="rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 mt-2"
              >
                Test Another Problem
              </button>
            </div>
          ) : currentQuestion ? (
            /* Question & Option Cards */
            <div className="space-y-4">
              <div className="rounded-lg bg-slate-50 dark:bg-slate-950 p-4 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Question</span>
                <p className="text-sm font-semibold text-slate-900 dark:text-white mt-1">{currentQuestion.question}</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {currentQuestion.options.map((opt, i) => (
                  <button
                    key={`opt-${i}`}
                    type="button"
                    onClick={() => handleOptionSelect(opt)}
                    className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4 text-left transition-colors hover:border-blue-500 hover:bg-slate-100 dark:hover:bg-slate-800/80"
                  >
                    <div className="text-xs font-semibold text-slate-900 dark:text-slate-200">{opt.text}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      {opt.recommendation ? 'Pinpoints algorithm' : 'Proceed to next check'}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
