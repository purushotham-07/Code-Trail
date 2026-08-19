import { useState, useMemo } from 'react';

const SYNTAX_CATEGORIES = [
  'Hash Maps & Dictionaries',
  'Hash Sets',
  'Arrays & Dynamic Lists',
  'Heaps & Priority Queues',
  'Sorting & Comparators',
  'Stacks, Queues & Deques',
  'Binary Search & Lower Bound',
  'Strings & Char Methods',
  '2D Grids & DP Matrices',
  'Trees, Graphs & DSU',
  'Bit Manipulation & Math',
];

const SYNTAX_DATABASE = {
  'Hash Maps & Dictionaries': [
    {
      title: 'Initialize Map',
      time: 'O(1)',
      python: 'seen = {}  # or from collections import defaultdict; seen = defaultdict(int)',
      java: 'Map<Integer, Integer> map = new HashMap<>();',
      cpp: '#include <unordered_map>\nunordered_map<int, int> map;',
      javascript: 'const map = new Map();',
    },
    {
      title: 'Put / Set Key-Value',
      time: 'O(1)',
      python: 'seen[key] = val',
      java: 'map.put(key, val);',
      cpp: 'map[key] = val; // or map.insert({key, val});',
      javascript: 'map.set(key, val);',
    },
    {
      title: 'Get Value with Default Fallback',
      time: 'O(1)',
      python: 'count = seen.get(key, 0)',
      java: 'int count = map.getOrDefault(key, 0);',
      cpp: 'int count = map.count(key) ? map[key] : 0;',
      javascript: 'const count = map.get(key) ?? 0;',
    },
    {
      title: 'Check If Key Exists',
      time: 'O(1)',
      python: 'if key in seen:\n    # key exists',
      java: 'if (map.containsKey(key)) {\n    // key exists\n}',
      cpp: 'if (map.find(key) != map.end()) {\n    // key exists\n}',
      javascript: 'if (map.has(key)) {\n  // key exists\n}',
    },
    {
      title: 'Remove / Delete Key',
      time: 'O(1)',
      python: 'del seen[key]  # or seen.pop(key, None)',
      java: 'map.remove(key);',
      cpp: 'map.erase(key);',
      javascript: 'map.delete(key);',
    },
    {
      title: 'Iterate Over Key-Value Pairs',
      time: 'O(N)',
      python: 'for key, val in seen.items():\n    print(key, val)',
      java: 'for (Map.Entry<Integer, Integer> entry : map.entrySet()) {\n    int k = entry.getKey(), v = entry.getValue();\n}',
      cpp: 'for (const auto& [key, val] : map) {\n    cout << key << ": " << val << endl;\n}',
      javascript: 'for (const [key, val] of map.entries()) {\n  console.log(key, val);\n}',
    },
    {
      title: 'Compute Frequency Map in 1 Line',
      time: 'O(N)',
      python: 'from collections import Counter\nfreq = Counter(nums)',
      java: 'Map<Integer, Integer> freq = new HashMap<>();\nfor (int n : nums) freq.put(n, freq.getOrDefault(n, 0) + 1);',
      cpp: 'unordered_map<int, int> freq;\nfor (int n : nums) freq[n]++;',
      javascript: 'const freq = new Map();\nfor (const n of nums) freq.set(n, (freq.get(n) || 0) + 1);',
    },
  ],
  'Hash Sets': [
    {
      title: 'Initialize Set',
      time: 'O(1)',
      python: 'visited = set()  # or visited = set(nums)',
      java: 'Set<Integer> visited = new HashSet<>();',
      cpp: '#include <unordered_set>\nunordered_set<int> visited;',
      javascript: 'const visited = new Set(); // or new Set(nums)',
    },
    {
      title: 'Add Element',
      time: 'O(1)',
      python: 'visited.add(x)',
      java: 'visited.add(x);',
      cpp: 'visited.insert(x);',
      javascript: 'visited.add(x);',
    },
    {
      title: 'Check If Element Exists',
      time: 'O(1)',
      python: 'if x in visited:\n    pass',
      java: 'if (visited.contains(x)) {\n}',
      cpp: 'if (visited.count(x)) { // or visited.find(x) != visited.end()\n}',
      javascript: 'if (visited.has(x)) {\n}',
    },
    {
      title: 'Remove Element',
      time: 'O(1)',
      python: 'visited.discard(x)  # discard does not error if missing',
      java: 'visited.remove(x);',
      cpp: 'visited.erase(x);',
      javascript: 'visited.delete(x);',
    },
    {
      title: 'Set Size & Clear',
      time: 'O(1)',
      python: 'size = len(visited)\nvisited.clear()',
      java: 'int size = visited.size();\nvisited.clear();',
      cpp: 'int size = visited.size();\nvisited.clear();',
      javascript: 'const size = visited.size;\nvisited.clear();',
    },
  ],
  'Arrays & Dynamic Lists': [
    {
      title: 'Initialize Dynamic List',
      time: 'O(1)',
      python: 'nums = []\n# or pre-allocated: nums = [0] * n',
      java: 'List<Integer> list = new ArrayList<>();\n// or int[] arr = new int[n];',
      cpp: '#include <vector>\nvector<int> nums;\n// or pre-allocated: vector<int> nums(n, 0);',
      javascript: 'const nums = [];\n// or pre-allocated: const nums = new Array(n).fill(0);',
    },
    {
      title: 'Append / Push to End',
      time: 'O(1) amortized',
      python: 'nums.append(val)',
      java: 'list.add(val);',
      cpp: 'nums.push_back(val);',
      javascript: 'nums.push(val);',
    },
    {
      title: 'Pop from End',
      time: 'O(1)',
      python: 'last = nums.pop()',
      java: 'int last = list.remove(list.size() - 1);',
      cpp: 'int last = nums.back();\nnums.pop_back();',
      javascript: 'const last = nums.pop();',
    },
    {
      title: 'Subarray / Slice Extraction [start, end)',
      time: 'O(K)',
      python: 'sub = nums[start:end]',
      java: 'List<Integer> sub = list.subList(start, end); // or Arrays.copyOfRange(arr, start, end);',
      cpp: 'vector<int> sub(nums.begin() + start, nums.begin() + end);',
      javascript: 'const sub = nums.slice(start, end);',
    },
    {
      title: 'Reverse Array In-Place',
      time: 'O(N)',
      python: 'nums.reverse()  # or nums = nums[::-1]',
      java: 'Collections.reverse(list); // or two-pointer swap on int[]',
      cpp: 'reverse(nums.begin(), nums.end());',
      javascript: 'nums.reverse();',
    },
    {
      title: 'Find Min, Max & Sum',
      time: 'O(N)',
      python: 'min_val = min(nums)\nmax_val = max(nums)\ntotal = sum(nums)',
      java: 'int minVal = Arrays.stream(arr).min().getAsInt();\nint maxVal = Arrays.stream(arr).max().getAsInt();\nint total = Arrays.stream(arr).sum();',
      cpp: 'int minVal = *min_element(nums.begin(), nums.end());\nint maxVal = *max_element(nums.begin(), nums.end());\nint total = accumulate(nums.begin(), nums.end(), 0);',
      javascript: 'const minVal = Math.min(...nums);\nconst maxVal = Math.max(...nums);\nconst total = nums.reduce((acc, curr) => acc + curr, 0);',
    },
  ],
  'Heaps & Priority Queues': [
    {
      title: 'Min Heap (Push & Pop Minimum)',
      time: 'Push: O(log N), Pop: O(log N)',
      python: 'import heapq\nh = []\nheapq.heappush(h, val)\nmin_val = heapq.heappop(h)\nmin_peek = h[0]',
      java: 'PriorityQueue<Integer> pq = new PriorityQueue<>();\npq.offer(val);\nint minVal = pq.poll();\nint minPeek = pq.peek();',
      cpp: '#include <queue>\npriority_queue<int, vector<int>, greater<int>> pq;\npq.push(val);\nint minVal = pq.top();\npq.pop();',
      javascript: '// Standard Min Heap class implementation\nclass MinHeap {\n  push(val) { /* O(log N) */ }\n  pop() { /* returns min O(log N) */ }\n  peek() { return this.heap[0]; }\n}',
    },
    {
      title: 'Max Heap (Push & Pop Maximum)',
      time: 'Push: O(log N), Pop: O(log N)',
      python: '# Push negated value for max-heap\nheapq.heappush(h, -val)\nmax_val = -heapq.heappop(h)',
      java: 'PriorityQueue<Integer> maxPq = new PriorityQueue<>(Collections.reverseOrder());\nmaxPq.offer(val);\nint maxVal = maxPq.poll();',
      cpp: 'priority_queue<int> maxPq; // Default priority_queue is max-heap in C++\nmaxPq.push(val);\nint maxVal = maxPq.top();\nmaxPq.pop();',
      javascript: '// MinHeap with negated values or custom comparator MaxHeap',
    },
    {
      title: 'Heapify Array In-Place',
      time: 'O(N)',
      python: 'heapq.heapify(nums)  # converts list to min-heap in O(N)',
      java: 'PriorityQueue<Integer> pq = new PriorityQueue<>(list); // O(N) constructor',
      cpp: 'priority_queue<int, vector<int>, greater<int>> pq(nums.begin(), nums.end());',
      javascript: '// Build heap by calling siftDown from floor(N/2) down to 0 in O(N)',
    },
    {
      title: 'Custom Pair Heap (e.g. by Frequency)',
      time: 'O(log N)',
      python: '# Sorts by 1st tuple element automatically\nheapq.heappush(h, (freq, val))',
      java: 'PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> Integer.compare(a[0], b[0]));\npq.offer(new int[]{freq, val});',
      cpp: 'auto comp = [](const pair<int,int>& a, const pair<int,int>& b) {\n    return a.first > b.first; // Min-heap on frequency\n};\npriority_queue<pair<int,int>, vector<pair<int,int>>, decltype(comp)> pq(comp);',
      javascript: 'pq.push({ freq, val }, (a, b) => a.freq - b.freq);',
    },
  ],
  'Sorting & Comparators': [
    {
      title: 'Sort Array in Ascending Order',
      time: 'O(N log N)',
      python: 'nums.sort()  # in-place, or sorted_nums = sorted(nums)',
      java: 'Arrays.sort(nums); // or Collections.sort(list);',
      cpp: 'sort(nums.begin(), nums.end());',
      javascript: 'nums.sort((a, b) => a - b);',
    },
    {
      title: 'Sort Array in Descending Order',
      time: 'O(N log N)',
      python: 'nums.sort(reverse=True)',
      java: 'Arrays.sort(boxedNums, Collections.reverseOrder());',
      cpp: 'sort(nums.begin(), nums.end(), greater<int>());',
      javascript: 'nums.sort((a, b) => b - a);',
    },
    {
      title: 'Sort 2D Intervals by Start Time',
      time: 'O(N log N)',
      python: 'intervals.sort(key=lambda x: x[0])',
      java: 'Arrays.sort(intervals, (a, b) -> Integer.compare(a[0], b[0]));',
      cpp: 'sort(intervals.begin(), intervals.end(), [](const vector<int>& a, const vector<int>& b) {\n    return a[0] < b[0];\n});',
      javascript: 'intervals.sort((a, b) => a[0] - b[0]);',
    },
    {
      title: 'Multi-Key Sorting (Primary ASC, Secondary DESC)',
      time: 'O(N log N)',
      python: 'items.sort(key=lambda x: (x[0], -x[1]))',
      java: 'Arrays.sort(items, (a, b) -> a[0] != b[0] ? Integer.compare(a[0], b[0]) : Integer.compare(b[1], a[1]));',
      cpp: 'sort(items.begin(), items.end(), [](const auto& a, const auto& b) {\n    if (a.first != b.first) return a.first < b.first;\n    return a.second > b.second;\n});',
      javascript: 'items.sort((a, b) => a[0] !== b[0] ? a[0] - b[0] : b[1] - a[1]);',
    },
  ],
  'Stacks, Queues & Deques': [
    {
      title: 'Double-Ended Queue (Deque / FIFO Queue)',
      time: 'O(1) on both ends',
      python: 'from collections import deque\nq = deque()\nq.append(x)      # push right\nq.appendleft(x)  # push left\nx = q.pop()      # pop right\nx = q.popleft()  # pop left (FIFO queue dequeue)',
      java: 'Deque<Integer> dq = new ArrayDeque<>();\ndq.offerLast(x);   // push right\ndq.offerFirst(x);  // push left\nint r = dq.pollLast();  // pop right\nint l = dq.pollFirst(); // pop left (FIFO)',
      cpp: '#include <deque>\ndeque<int> dq;\ndq.push_back(x);\ndq.push_front(x);\ndq.pop_back();\ndq.pop_front();',
      javascript: 'const dq = [];\ndq.push(x);    // push right\ndq.unshift(x); // push left\ndq.pop();      // pop right\ndq.shift();    // pop left (Note: shift is O(N) in vanilla JS array; use linked-list Deque for O(1))',
    },
    {
      title: 'Monotonic Stack Template (Next Greater Element)',
      time: 'O(N)',
      python: 'stack = []  # stores indices\nres = [-1] * len(nums)\nfor i, num in enumerate(nums):\n    while stack and nums[stack[-1]] < num:\n        idx = stack.pop()\n        res[idx] = num\n    stack.append(i)',
      java: 'Deque<Integer> stack = new ArrayDeque<>();\nint[] res = new int[nums.length];\nArrays.fill(res, -1);\nfor (int i = 0; i < nums.length; i++) {\n    while (!stack.isEmpty() && nums[stack.peek()] < nums[i]) {\n        int idx = stack.pop();\n        res[idx] = nums[i];\n    }\n    stack.push(i);\n}',
      cpp: 'stack<int> st;\nvector<int> res(nums.size(), -1);\nfor (int i = 0; i < nums.size(); ++i) {\n    while (!st.empty() && nums[st.top()] < nums[i]) {\n        int idx = st.top(); st.pop();\n        res[idx] = nums[i];\n    }\n    st.push(i);\n}',
      javascript: 'const stack = [];\nconst res = new Array(nums.length).fill(-1);\nfor (let i = 0; i < nums.length; i++) {\n  while (stack.length && nums[stack[stack.length - 1]] < nums[i]) {\n    const idx = stack.pop();\n    res[idx] = nums[i];\n  }\n  stack.push(i);\n}',
    },
  ],
  'Binary Search & Lower Bound': [
    {
      title: 'Classic Binary Search (Exact Value Match)',
      time: 'O(log N)',
      python: 'l, r = 0, len(nums) - 1\nwhile l <= r:\n    mid = l + (r - l) // 2\n    if nums[mid] == target:\n        return mid\n    elif nums[mid] < target:\n        l = mid + 1\n    else:\n        r = mid - 1\nreturn -1',
      java: 'int l = 0, r = nums.length - 1;\nwhile (l <= r) {\n    int mid = l + (r - l) / 2;\n    if (nums[mid] == target) return mid;\n    else if (nums[mid] < target) l = mid + 1;\n    else r = mid - 1;\n}\nreturn -1;',
      cpp: 'int l = 0, r = nums.size() - 1;\nwhile (l <= r) {\n    int mid = l + (r - l) / 2;\n    if (nums[mid] == target) return mid;\n    else if (nums[mid] < target) l = mid + 1;\n    else r = mid - 1;\n}\nreturn -1;',
      javascript: 'let l = 0, r = nums.length - 1;\nwhile (l <= r) {\n  const mid = l + Math.floor((r - l) / 2);\n  if (nums[mid] === target) return mid;\n  else if (nums[mid] < target) l = mid + 1;\n  else r = mid - 1;\n}\nreturn -1;',
    },
    {
      title: 'Lower Bound (First Index >= Target)',
      time: 'O(log N)',
      python: 'import bisect\nidx = bisect.bisect_left(nums, target)',
      java: '// If not found, binarySearch returns (-(insertion point) - 1)\nint idx = Arrays.binarySearch(nums, target);\nif (idx < 0) idx = -idx - 1;',
      cpp: 'auto it = lower_bound(nums.begin(), nums.end(), target);\nint idx = distance(nums.begin(), it);',
      javascript: 'let l = 0, r = nums.length;\nwhile (l < r) {\n  const mid = l + Math.floor((r - l) / 2);\n  if (nums[mid] >= target) r = mid;\n  else l = mid + 1;\n}\n// l is the lower bound index',
    },
    {
      title: 'Upper Bound (First Index > Target)',
      time: 'O(log N)',
      python: 'import bisect\nidx = bisect.bisect_right(nums, target)',
      java: '// Custom upper_bound loop or loop over insertion index',
      cpp: 'auto it = upper_bound(nums.begin(), nums.end(), target);\nint idx = distance(nums.begin(), it);',
      javascript: 'let l = 0, r = nums.length;\nwhile (l < r) {\n  const mid = l + Math.floor((r - l) / 2);\n  if (nums[mid] > target) r = mid;\n  else l = mid + 1;\n}',
    },
  ],
  'Strings & Char Methods': [
    {
      title: 'Char to Lowercase ASCII Index (0-25)',
      time: 'O(1)',
      python: 'idx = ord(ch) - ord("a")',
      java: 'int idx = ch - \'a\';',
      cpp: 'int idx = ch - \'a\';',
      javascript: 'const idx = ch.charCodeAt(0) - 97;',
    },
    {
      title: 'Substring Extraction [start, end)',
      time: 'O(K)',
      python: 'sub = s[start:end]',
      java: 'String sub = s.substring(start, end);',
      cpp: 'string sub = s.substr(start, length);',
      javascript: 'const sub = s.slice(start, end);',
    },
    {
      title: 'Efficient String Builder (O(N) vs O(N^2) concat)',
      time: 'O(N)',
      python: 'chars = []\nchars.append(ch)\nres = "".join(chars)',
      java: 'StringBuilder sb = new StringBuilder();\nsb.append(ch);\nString res = sb.toString();',
      cpp: 'string s = "";\ns += ch; // std::string is mutable with dynamic buffer',
      javascript: 'const parts = [];\nparts.push(ch);\nconst res = parts.join("");',
    },
    {
      title: 'Check Palindrome In-Place',
      time: 'O(N), Space: O(1)',
      python: 'l, r = 0, len(s) - 1\nwhile l < r:\n    if s[l] != s[r]: return False\n    l, r = l + 1, r - 1\nreturn True',
      java: 'int l = 0, r = s.length() - 1;\nwhile (l < r) {\n    if (s.charAt(l) != s.charAt(r)) return false;\n    l++; r--;\n}\nreturn true;',
      cpp: 'int l = 0, r = s.length() - 1;\nwhile (l < r) {\n    if (s[l] != s[r]) return false;\n    l++; r--;\n}\nreturn true;',
      javascript: 'let l = 0, r = s.length - 1;\nwhile (l < r) {\n  if (s[l] !== s[r]) return false;\n  l++; r--;\n}\nreturn true;',
    },
  ],
  '2D Grids & DP Matrices': [
    {
      title: 'Initialize N x M DP Matrix with 0',
      time: 'O(N * M)',
      python: 'dp = [[0] * m for _ in range(n)]',
      java: 'int[][] dp = new int[n][m];',
      cpp: 'vector<vector<int>> dp(n, vector<int>(m, 0));',
      javascript: 'const dp = Array.from({ length: n }, () => new Array(m).fill(0));',
    },
    {
      title: 'Initialize N x M Matrix with Infinity',
      time: 'O(N * M)',
      python: 'dp = [[float("inf")] * m for _ in range(n)]',
      java: 'int[][] dp = new int[n][m];\nfor (int[] row : dp) Arrays.fill(row, Integer.MAX_VALUE / 2);',
      cpp: 'vector<vector<int>> dp(n, vector<int>(m, 1e9));',
      javascript: 'const dp = Array.from({ length: n }, () => new Array(m).fill(Infinity));',
    },
    {
      title: '4-Directional Grid Moves (Up, Right, Down, Left)',
      time: 'O(1)',
      python: 'dirs = [(-1, 0), (0, 1), (1, 0), (0, -1)]\nfor dr, dc in dirs:\n    nr, nc = r + dr, c + dc\n    if 0 <= nr < n and 0 <= nc < m:\n        # valid in-bounds neighbor\n        pass',
      java: 'int[][] dirs = {{-1, 0}, {0, 1}, {1, 0}, {0, -1}};\nfor (int[] d : dirs) {\n    int nr = r + d[0], nc = c + d[1];\n    if (nr >= 0 && nr < n && nc >= 0 && nc < m) {\n        // valid in-bounds neighbor\n    }\n}',
      cpp: 'int dirs[4][2] = {{-1, 0}, {0, 1}, {1, 0}, {0, -1}};\nfor (auto& d : dirs) {\n    int nr = r + d[0], nc = c + d[1];\n    if (nr >= 0 && nr < n && nc >= 0 && nc < m) {\n        // valid in-bounds neighbor\n    }\n}',
      javascript: 'const dirs = [[-1, 0], [0, 1], [1, 0], [0, -1]];\nfor (const [dr, dc] of dirs) {\n  const nr = r + dr, nc = c + dc;\n  if (nr >= 0 && nr < n && nc >= 0 && nc < m) {\n    // valid in-bounds neighbor\n  }\n}',
    },
  ],
  'Trees, Graphs & DSU': [
    {
      title: 'Graph Adjacency List Construction',
      time: 'O(V + E)',
      python: 'from collections import defaultdict\nadj = defaultdict(list)\nfor u, v in edges:\n    adj[u].append(v)\n    adj[v].append(u)  # if undirected',
      java: 'List<List<Integer>> adj = new ArrayList<>();\nfor (int i = 0; i < n; i++) adj.add(new ArrayList<>());\nfor (int[] e : edges) {\n    adj.get(e[0]).add(e[1]);\n    adj.get(e[1]).add(e[0]);\n}',
      cpp: 'vector<vector<int>> adj(n);\nfor (const auto& e : edges) {\n    adj[e[0]].push_back(e[1]);\n    adj[e[1]].push_back(e[0]);\n}',
      javascript: 'const adj = Array.from({ length: n }, () => []);\nfor (const [u, v] of edges) {\n  adj[u].push(v);\n  adj[v].push(u);\n}',
    },
    {
      title: 'Disjoint Set Union (DSU / Union-Find with Path Compression)',
      time: 'O(alpha(N)) ≈ O(1)',
      python: 'parent = list(range(n))\nrank = [1] * n\n\ndef find(i):\n    if parent[i] != i:\n        parent[i] = find(parent[i])\n    return parent[i]\n\ndef union(i, j):\n    root_i, root_j = find(i), find(j)\n    if root_i == root_j: return False\n    if rank[root_i] < rank[root_j]:\n        root_i, root_j = root_j, root_i\n    parent[root_j] = root_i\n    rank[root_i] += rank[root_j]\n    return True',
      java: 'class DSU {\n    int[] parent, rank;\n    public DSU(int n) {\n        parent = new int[n];\n        rank = new int[n];\n        for (int i = 0; i < n; i++) { parent[i] = i; rank[i] = 1; }\n    }\n    public int find(int i) {\n        if (parent[i] != i) parent[i] = find(parent[i]);\n        return parent[i];\n    }\n    public boolean union(int i, int j) {\n        int rootI = find(i), rootJ = find(j);\n        if (rootI == rootJ) return false;\n        if (rank[rootI] < rank[rootJ]) { int tmp = rootI; rootI = rootJ; rootJ = tmp; }\n        parent[rootJ] = rootI;\n        rank[rootI] += rank[rootJ];\n        return true;\n    }\n}',
      cpp: 'struct DSU {\n    vector<int> parent, rank;\n    DSU(int n) : parent(n), rank(n, 1) {\n        iota(parent.begin(), parent.end(), 0);\n    }\n    int find(int i) {\n        if (parent[i] != i) parent[i] = find(parent[i]);\n        return parent[i];\n    }\n    bool unite(int i, int j) {\n        int rootI = find(i), rootJ = find(j);\n        if (rootI == rootJ) return false;\n        if (rank[rootI] < rank[rootJ]) swap(rootI, rootJ);\n        parent[rootJ] = rootI;\n        rank[rootI] += rank[rootJ];\n        return true;\n    }\n};',
      javascript: 'class DSU {\n  constructor(n) {\n    this.parent = Array.from({ length: n }, (_, i) => i);\n    this.rank = new Array(n).fill(1);\n  }\n  find(i) {\n    if (this.parent[i] !== i) this.parent[i] = this.find(this.parent[i]);\n    return this.parent[i];\n  }\n  union(i, j) {\n    let rootI = this.find(i), rootJ = this.find(j);\n    if (rootI === rootJ) return false;\n    if (this.rank[rootI] < this.rank[rootJ]) [rootI, rootJ] = [rootJ, rootI];\n    this.parent[rootJ] = rootI;\n    this.rank[rootI] += this.rank[rootJ];\n    return true;\n  }\n}',
    },
  ],
  'Bit Manipulation & Math': [
    {
      title: 'Check / Set / Toggle / Clear k-th Bit',
      time: 'O(1)',
      python: 'is_set = (n >> k) & 1\nset_bit = n | (1 << k)\ntoggle_bit = n ^ (1 << k)\nclear_bit = n & ~(1 << k)',
      java: 'boolean isSet = ((n >> k) & 1) == 1;\nint setBit = n | (1 << k);\nint toggleBit = n ^ (1 << k);\nint clearBit = n & ~(1 << k);',
      cpp: 'bool isSet = (n >> k) & 1;\nint setBit = n | (1 << k);\nint toggleBit = n ^ (1 << k);\nint clearBit = n & ~(1 << k);',
      javascript: 'const isSet = ((n >> k) & 1) === 1;\nconst setBit = n | (1 << k);\nconst toggleBit = n ^ (1 << k);\nconst clearBit = n & ~(1 << k);',
    },
    {
      title: 'Check Power of Two & Count Set Bits',
      time: 'O(1)',
      python: 'is_pow2 = n > 0 and (n & (n - 1)) == 0\nset_bits = bin(n).count("1")',
      java: 'boolean isPow2 = n > 0 && (n & (n - 1)) == 0;\nint setBits = Integer.bitCount(n);',
      cpp: 'bool isPow2 = n > 0 && (n & (n - 1)) == 0;\nint setBits = __builtin_popcount(n);',
      javascript: 'const isPow2 = n > 0 && (n & (n - 1)) === 0;\nlet count = 0, temp = n;\nwhile (temp) { temp &= temp - 1; count++; }',
    },
    {
      title: 'Greatest Common Divisor (GCD) / LCM',
      time: 'O(log(min(a, b)))',
      python: 'import math\ngcd_val = math.gcd(a, b)\nlcm_val = (a * b) // gcd_val',
      java: 'public static int gcd(int a, int b) {\n    return b == 0 ? a : gcd(b, a % b);\n}',
      cpp: '#include <numeric>\nint gcdVal = std::gcd(a, b);\nint lcmVal = std::lcm(a, b);',
      javascript: 'function gcd(a, b) {\n  return b === 0 ? a : gcd(b, a % b);\n}',
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
  const [activeCategory, setActiveCategory] = useState('Hash Maps & Dictionaries');
  const [searchMethodQuery, setSearchMethodQuery] = useState('');
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

  const handleDecisionReset = () => {
    setCurrentQuestionId('sorted');
    setDecisionHistory([]);
    setFinalRecommendation(null);
  };

  const currentQuestion = DECISION_TREE_QUESTIONS.find((q) => q.id === currentQuestionId);

  // Filter methods across categories based on search query
  const filteredMethods = useMemo(() => {
    const methods = SYNTAX_DATABASE[activeCategory] || [];
    if (!searchMethodQuery.trim()) return methods;
    const q = searchMethodQuery.toLowerCase();
    return methods.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        (m[activeLang] && m[activeLang].toLowerCase().includes(q))
    );
  }, [activeCategory, searchMethodQuery, activeLang]);

  return (
    <div className="rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-white dark:bg-[#181a24] p-4 text-xs shadow-sm space-y-4">
      {/* Top Header & Tool Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-[#2a2e3f] pb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded bg-indigo-600 font-bold text-white text-[11px]">
            DSA
          </span>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">DSA Student Mastery Toolkit</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              All 4-language methods, Big-O constraint calculator & pattern recognition
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 rounded-lg bg-slate-100 dark:bg-[#11131c] p-1 border border-slate-200 dark:border-[#2a2e3f]">
          <button
            type="button"
            onClick={() => setActiveTab('syntax')}
            className={`rounded px-2.5 py-1 text-xs font-semibold transition-colors ${
              activeTab === 'syntax'
                ? 'bg-white dark:bg-[#202538] text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            All Methods (4-Lang)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('calculator')}
            className={`rounded px-2.5 py-1 text-xs font-semibold transition-colors ${
              activeTab === 'calculator'
                ? 'bg-white dark:bg-[#202538] text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Big-O Constraint Advisor
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('decision')}
            className={`rounded px-2.5 py-1 text-xs font-semibold transition-colors ${
              activeTab === 'decision'
                ? 'bg-white dark:bg-[#202538] text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Pattern Wizard
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="ml-2 text-slate-400 hover:text-slate-600 dark:hover:text-white text-xs px-1"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* TAB 1: ALL METHODS (4-LANG SYNTAX CHEAT SHEET) */}
      {activeTab === 'syntax' && (
        <div className="space-y-3">
          {/* Controls: Language Buttons + Search Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1">
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
                  className={`rounded px-2.5 py-1 text-[11px] font-semibold border transition-colors ${
                    activeLang === lang.id
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                      : 'bg-white dark:bg-[#202538] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-[#2a2e3f] hover:bg-slate-50 dark:hover:bg-[#272d45]'
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>

            <div className="relative min-w-[200px]">
              <input
                type="text"
                value={searchMethodQuery}
                onChange={(e) => setSearchMethodQuery(e.target.value)}
                placeholder="Search methods in category…"
                className="w-full rounded border border-slate-200 dark:border-[#2a2e3f] bg-slate-50 dark:bg-[#11131c] px-2.5 py-1 text-[11px] text-slate-900 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Category Pills */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {SYNTAX_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setActiveCategory(cat);
                  setSearchMethodQuery('');
                }}
                className={`rounded-full px-2.5 py-0.5 text-[10.5px] font-medium border transition-colors ${
                  activeCategory === cat
                    ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-600 font-bold'
                    : 'bg-slate-50 dark:bg-[#151824] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-[#2a2e3f] hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Method Snippets Grid */}
          <div className="space-y-2.5 pt-1 max-h-[480px] overflow-y-auto pr-1">
            {filteredMethods.length === 0 ? (
              <p className="text-center py-6 text-slate-400">No matching methods found.</p>
            ) : (
              filteredMethods.map((snippet, idx) => (
                <div
                  key={`snip-${idx}`}
                  className="rounded-lg border border-slate-200 dark:border-[#2a2e3f] bg-slate-50 dark:bg-[#11131c] p-3 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{snippet.title}</span>
                      {snippet.time && (
                        <span className="rounded bg-indigo-50 dark:bg-indigo-900/30 px-1.5 py-0.5 font-mono text-[9.5px] font-semibold text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                          {snippet.time}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(snippet[activeLang] || '')}
                      className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
                    >
                      {copiedSnippet === snippet[activeLang] ? '✓ Copied' : 'Copy Code'}
                    </button>
                  </div>
                  <pre className="overflow-x-auto rounded bg-white dark:bg-[#0b0d14] p-2.5 font-mono text-[11px] text-emerald-700 dark:text-emerald-300 border border-slate-200 dark:border-[#222738] leading-relaxed">
                    <code>{snippet[activeLang] || '// Not applicable'}</code>
                  </pre>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 2: BIG-O CONSTRAINT ADVISOR */}
      {activeTab === 'calculator' && (
        <div className="space-y-3">
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white">Big-O Limit & Time Budget Calculator</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              CP platforms allow approx. <strong>10^8 operations per second</strong>. Select your input size $N$ to find the optimal algorithm.
            </p>
          </div>

          {/* Tier Buttons */}
          <div className="grid gap-2 sm:grid-cols-5">
            {CONSTRAINT_TIERS.map((tier, idx) => (
              <button
                key={tier.range}
                type="button"
                onClick={() => setSelectedConstraintIdx(idx)}
                className={`rounded-lg border p-2.5 text-left transition-all ${
                  selectedConstraintIdx === idx
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 ring-1 ring-indigo-500'
                    : 'border-slate-200 dark:border-[#2a2e3f] bg-slate-50 dark:bg-[#11131c] hover:bg-slate-100 dark:hover:bg-[#1a1e2d]'
                }`}
              >
                <div className="font-mono text-xs font-bold text-slate-900 dark:text-white">{tier.range}</div>
                <div className="mt-1 font-mono text-[10.5px] font-semibold text-indigo-600 dark:text-indigo-400">
                  {tier.allowedComplexity}
                </div>
              </button>
            ))}
          </div>

          {/* Selected Tier Details */}
          {CONSTRAINT_TIERS[selectedConstraintIdx] && (
            <div className="rounded-lg border border-indigo-200 dark:border-indigo-900/50 bg-slate-50 dark:bg-[#11131c] p-4 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-[#2a2e3f] pb-2">
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  Target for {CONSTRAINT_TIERS[selectedConstraintIdx].range}:
                </span>
                <span className="rounded bg-emerald-100 dark:bg-emerald-900/40 px-2 py-0.5 font-mono text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                  {CONSTRAINT_TIERS[selectedConstraintIdx].allowedComplexity}
                </span>
              </div>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-xs">
                <strong>Recommended Patterns:</strong> {CONSTRAINT_TIERS[selectedConstraintIdx].patterns}
              </p>
              <p className="text-[11px] text-slate-500 leading-snug">
                {CONSTRAINT_TIERS[selectedConstraintIdx].status}
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: PATTERN RECOGNITION WIZARD */}
      {activeTab === 'decision' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-slate-900 dark:text-white">Pattern Recognition Wizard</h4>
            <button
              type="button"
              onClick={handleDecisionReset}
              className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Start Over
            </button>
          </div>

          {!finalRecommendation && currentQuestion && (
            <div className="rounded-lg border border-slate-200 dark:border-[#2a2e3f] bg-slate-50 dark:bg-[#11131c] p-4 space-y-3">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{currentQuestion.question}</p>
              <div className="space-y-2">
                {currentQuestion.options.map((opt, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleOptionSelect(opt)}
                    className="w-full text-left rounded-md border border-slate-200 dark:border-[#2a2e3f] bg-white dark:bg-[#181a24] p-2.5 text-xs text-slate-700 dark:text-slate-300 hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 transition-colors"
                  >
                    {opt.text}
                  </button>
                ))}
              </div>
            </div>
          )}

          {finalRecommendation && (
            <div className="rounded-lg border border-emerald-300 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/30 p-4 space-y-2">
              <span className="rounded bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white uppercase">
                Recommended Solution Pattern
              </span>
              <h4 className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
                {finalRecommendation.recommendation}
              </h4>
              <p className="font-mono text-xs text-slate-700 dark:text-slate-300">{finalRecommendation.complexity}</p>
              <button
                type="button"
                onClick={handleDecisionReset}
                className="mt-2 text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold block"
              >
                ← Test Another Problem
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
