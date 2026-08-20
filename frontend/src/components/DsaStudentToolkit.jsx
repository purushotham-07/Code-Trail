import { useState, useMemo } from 'react';

const SYNTAX_CATEGORIES = [
  'Hash Maps & Dictionaries',
  'Hash Sets',
  'Strings & StringBuilder',
  'Arrays & Dynamic Lists',
  'Stacks & Monotonic Stacks',
  'Queues & Deques',
  'Linked Lists',
  'Binary Trees (Pre, In, Post, Level-Order)',
  'Graphs (BFS, DFS, TopoSort, Dijkstra)',
  'Heaps & Priority Queues',
  'Disjoint Set Union (DSU)',
  'Binary Search & Bounds',
  'Sorting & Comparators',
  '2D Grids & DP Matrices',
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
    {
      title: 'Map Size, IsEmpty & Clear',
      time: 'O(1)',
      python: 'size = len(seen)\nis_empty = len(seen) == 0\nseen.clear()',
      java: 'int size = map.size();\nboolean isEmpty = map.isEmpty();\nmap.clear();',
      cpp: 'int size = map.size();\nbool isEmpty = map.empty();\nmap.clear();',
      javascript: 'const size = map.size;\nconst isEmpty = map.size === 0;\nmap.clear();',
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
      title: 'Set Union, Intersection & Difference',
      time: 'O(N)',
      python: 'u = setA | setB   # union\ni = setA & setB   # intersection\nd = setA - setB   # difference',
      java: 'Set<Integer> u = new HashSet<>(setA); u.addAll(setB);\nSet<Integer> i = new HashSet<>(setA); i.retainAll(setB);\nSet<Integer> d = new HashSet<>(setA); d.removeAll(setB);',
      cpp: '// In C++, iterate elements or use std::set_intersection / std::set_union on sorted sets\nunordered_set<int> u = setA; for (int x : setB) u.insert(x);',
      javascript: 'const u = new Set([...setA, ...setB]);\nconst i = new Set([...setA].filter(x => setB.has(x)));\nconst d = new Set([...setA].filter(x => !setB.has(x)));',
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
  'Strings & StringBuilder': [
    {
      title: 'String Length & Index Access',
      time: 'O(1)',
      python: 'n = len(s)\nch = s[i]',
      java: 'int n = s.length();\nchar ch = s.charAt(i);',
      cpp: 'int n = s.length(); // or s.size()\nchar ch = s[i];',
      javascript: 'const n = s.length;\nconst ch = s[i]; // or s.charAt(i)',
    },
    {
      title: 'Char to ASCII Index (0-25) & ASCII to Char',
      time: 'O(1)',
      python: 'idx = ord(ch) - ord("a")\nchar_back = chr(ord("a") + idx)',
      java: 'int idx = ch - \'a\';\nchar charBack = (char)(\'a\' + idx);',
      cpp: 'int idx = ch - \'a\';\nchar charBack = \'a\' + idx;',
      javascript: 'const idx = ch.charCodeAt(0) - 97;\nconst charBack = String.fromCharCode(97 + idx);',
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
      title: 'StringBuilder / Dynamic String Mutation',
      time: 'O(1) append, O(N) toString',
      python: 'chars = []\nchars.append(ch)\nres = "".join(chars)',
      java: 'StringBuilder sb = new StringBuilder();\nsb.append(ch);\nsb.append("word");\nsb.reverse();\nString res = sb.toString();',
      cpp: 'string s = "";\ns += ch;\ns += "word";\nreverse(s.begin(), s.end());',
      javascript: 'const parts = [];\nparts.push(ch);\nparts.push("word");\nconst res = parts.join("");',
    },
    {
      title: 'StringBuilder In-Place Character Mutation',
      time: 'O(1) set/delete, O(K) insert',
      python: 'arr = list(s)\narr[i] = "x"\ndel arr[i]\narr.insert(i, "y")\ns = "".join(arr)',
      java: 'StringBuilder sb = new StringBuilder(s);\nsb.setCharAt(i, \'x\');\nsb.deleteCharAt(i);\nsb.insert(i, \'y\');',
      cpp: 's[i] = \'x\';\ns.erase(i, 1);\ns.insert(i, 1, \'y\');',
      javascript: 'const arr = s.split("");\narr[i] = "x";\narr.splice(i, 1);\narr.splice(i, 0, "y");\nconst res = arr.join("");',
    },
    {
      title: 'String Split, Join & Trim',
      time: 'O(N)',
      python: 'words = s.strip().split(" ")  # trim + split\njoined = "-".join(words)',
      java: 'String[] words = s.trim().split("\\\\s+");\nString joined = String.join("-", words);',
      cpp: '// In C++, use stringstream for whitespace splitting\nstringstream ss(s);\nstring word;\nvector<string> words;\nwhile (ss >> word) words.push_back(word);',
      javascript: 'const words = s.trim().split(/\\s+/);\nconst joined = words.join("-");',
    },
    {
      title: 'String Search & Matching',
      time: 'O(N * M)',
      python: 'idx = s.find("sub")  # -1 if not found\nhas_sub = "sub" in s\nstarts = s.startswith("pre")\nends = s.endswith("suf")',
      java: 'int idx = s.indexOf("sub");\nboolean hasSub = s.contains("sub");\nboolean starts = s.startsWith("pre");\nboolean ends = s.endsWith("suf");',
      cpp: 'size_t idx = s.find("sub"); // string::npos if not found\nbool hasSub = (idx != string::npos);\nbool starts = (s.rfind("pre", 0) == 0);',
      javascript: 'const idx = s.indexOf("sub");\nconst hasSub = s.includes("sub");\nconst starts = s.startsWith("pre");\nconst ends = s.endsWith("suf");',
    },
    {
      title: 'Char Classification (Digit, Letter, Case)',
      time: 'O(1)',
      python: 'is_digit = ch.isdigit()\nis_alpha = ch.isalpha()\nis_lower = ch.islower()\nupper_ch = ch.upper()',
      java: 'boolean isDigit = Character.isDigit(ch);\nboolean isLetter = Character.isLetter(ch);\nchar lowerCh = Character.toLowerCase(ch);',
      cpp: 'bool isDigit = isdigit(ch);\nbool isAlpha = isalpha(ch);\nchar lowerCh = tolower(ch);',
      javascript: 'const isDigit = /\\d/.test(ch);\nconst isAlpha = /[a-zA-Z]/.test(ch);\nconst lowerCh = ch.toLowerCase();',
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
      title: 'Insert / Remove by Index',
      time: 'O(N)',
      python: 'nums.insert(i, val)\nnums.pop(i)  # or del nums[i]',
      java: 'list.add(i, val);\nlist.remove(i);',
      cpp: 'nums.insert(nums.begin() + i, val);\nnums.erase(nums.begin() + i);',
      javascript: 'nums.splice(i, 0, val); // insert\nnums.splice(i, 1);        // remove',
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
      title: 'Fill Array with Value',
      time: 'O(N)',
      python: 'nums = [val] * n',
      java: 'Arrays.fill(arr, val);',
      cpp: 'fill(nums.begin(), nums.end(), val);',
      javascript: 'nums.fill(val);',
    },
    {
      title: 'Prefix Sum Array (O(1) Range Queries)',
      time: 'Build: O(N), Query: O(1)',
      python: 'prefix = [0] * (len(nums) + 1)\nfor i in range(len(nums)):\n    prefix[i + 1] = prefix[i] + nums[i]\n# rangeSum(l, r) = prefix[r + 1] - prefix[l]',
      java: 'int[] prefix = new int[nums.length + 1];\nfor (int i = 0; i < nums.length; i++) {\n    prefix[i + 1] = prefix[i] + nums[i];\n}\n// sum [l, r] = prefix[r + 1] - prefix[l]',
      cpp: 'vector<int> prefix(nums.size() + 1, 0);\nfor (int i = 0; i < nums.size(); ++i) {\n    prefix[i + 1] = prefix[i] + nums[i];\n}',
      javascript: 'const prefix = new Array(nums.length + 1).fill(0);\nfor (let i = 0; i < nums.length; i++) {\n  prefix[i + 1] = prefix[i] + nums[i];\n}',
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
  'Stacks & Monotonic Stacks': [
    {
      title: 'Stack Core Operations (Push, Pop, Peek, Empty)',
      time: 'O(1) all ops',
      python: 'stack = []\nstack.append(x)   # push\ntop = stack[-1]   # peek\nx = stack.pop()   # pop\nis_empty = len(stack) == 0',
      java: 'Deque<Integer> stack = new ArrayDeque<>();\nstack.push(x);       // push\nint top = stack.peek(); // peek\nint x = stack.pop();    // pop\nboolean isEmpty = stack.isEmpty();',
      cpp: '#include <stack>\nstack<int> st;\nst.push(x);\nint top = st.top();\nst.pop();\nbool isEmpty = st.empty();',
      javascript: 'const stack = [];\nstack.push(x);               // push\nconst top = stack[stack.length - 1]; // peek\nconst x = stack.pop();        // pop\nconst isEmpty = stack.length === 0;',
    },
    {
      title: 'Monotonic Stack (Next Greater Element)',
      time: 'O(N)',
      python: 'stack = []  # stores indices\nres = [-1] * len(nums)\nfor i, num in enumerate(nums):\n    while stack and nums[stack[-1]] < num:\n        idx = stack.pop()\n        res[idx] = num\n    stack.append(i)',
      java: 'Deque<Integer> stack = new ArrayDeque<>();\nint[] res = new int[nums.length];\nArrays.fill(res, -1);\nfor (int i = 0; i < nums.length; i++) {\n    while (!stack.isEmpty() && nums[stack.peek()] < nums[i]) {\n        int idx = stack.pop();\n        res[idx] = nums[i];\n    }\n    stack.push(i);\n}',
      cpp: 'stack<int> st;\nvector<int> res(nums.size(), -1);\nfor (int i = 0; i < nums.size(); ++i) {\n    while (!st.empty() && nums[st.top()] < nums[i]) {\n        int idx = st.top(); st.pop();\n        res[idx] = nums[i];\n    }\n    st.push(i);\n}',
      javascript: 'const stack = [];\nconst res = new Array(nums.length).fill(-1);\nfor (let i = 0; i < nums.length; i++) {\n  while (stack.length && nums[stack[stack.length - 1]] < nums[i]) {\n    const idx = stack.pop();\n    res[idx] = nums[i];\n  }\n  stack.push(i);\n}',
    },
    {
      title: 'Monotonic Stack (Previous Smaller Element)',
      time: 'O(N)',
      python: 'stack = []\npse = [-1] * len(nums)\nfor i, num in enumerate(nums):\n    while stack and nums[stack[-1]] >= num:\n        stack.pop()\n    pse[i] = stack[-1] if stack else -1\n    stack.append(i)',
      java: 'Deque<Integer> stack = new ArrayDeque<>();\nint[] pse = new int[nums.length];\nfor (int i = 0; i < nums.length; i++) {\n    while (!stack.isEmpty() && nums[stack.peek()] >= nums[i]) stack.pop();\n    pse[i] = stack.isEmpty() ? -1 : stack.peek();\n    stack.push(i);\n}',
      cpp: 'stack<int> st;\nvector<int> pse(nums.size());\nfor (int i = 0; i < nums.size(); ++i) {\n    while (!st.empty() && nums[st.top()] >= nums[i]) st.pop();\n    pse[i] = st.empty() ? -1 : st.top();\n    st.push(i);\n}',
      javascript: 'const stack = [];\nconst pse = new Array(nums.length);\nfor (let i = 0; i < nums.length; i++) {\n  while (stack.length && nums[stack[stack.length - 1]] >= nums[i]) stack.pop();\n  pse[i] = stack.length ? stack[stack.length - 1] : -1;\n  stack.push(i);\n}',
    },
    {
      title: 'Valid Parentheses Matching Template',
      time: 'O(N), Space: O(N)',
      python: 'stack = []\npairs = {")": "(", "}": "{", "]": "["}\nfor ch in s:\n    if ch in pairs:\n        if not stack or stack.pop() != pairs[ch]:\n            return False\n    else:\n        stack.append(ch)\nreturn len(stack) == 0',
      java: 'Deque<Character> stack = new ArrayDeque<>();\nfor (char c : s.toCharArray()) {\n    if (c == \'(\') stack.push(\')\');\n    else if (c == \'{\') stack.push(\'}\');\n    else if (c == \'[\') stack.push(\']\');\n    else if (stack.isEmpty() || stack.pop() != c) return false;\n}\nreturn stack.isEmpty();',
      cpp: 'stack<char> st;\nfor (char c : s) {\n    if (c == \'(\') st.push(\')\');\n    else if (c == \'{\') st.push(\'}\');\n    else if (c == \'[\') st.push(\']\');\n    else if (st.empty() || st.top() != c) return false;\n    else st.pop();\n}\nreturn st.empty();',
      javascript: 'const stack = [];\nconst pairs = { ")": "(", "}": "{", "]": "[" };\nfor (const ch of s) {\n  if (pairs[ch]) {\n    if (stack.pop() !== pairs[ch]) return false;\n  } else {\n    stack.push(ch);\n  }\n}\nreturn stack.length === 0;',
    },
  ],
  'Queues & Deques': [
    {
      title: 'FIFO Queue Operations',
      time: 'O(1) all ops',
      python: 'from collections import deque\nq = deque()\nq.append(x)     # enqueue\nx = q.popleft() # dequeue\nfront = q[0]    # peek front\nis_empty = len(q) == 0',
      java: 'Queue<Integer> q = new LinkedList<>();\nq.offer(x);       // enqueue\nint x = q.poll(); // dequeue\nint front = q.peek(); // peek\nboolean isEmpty = q.isEmpty();',
      cpp: '#include <queue>\nqueue<int> q;\nq.push(x);\nint x = q.front();\nq.pop();\nbool isEmpty = q.empty();',
      javascript: '// For O(1) dequeue in JS, use pointer on array or linked list\nconst q = [];\nq.push(x);\nconst front = q.shift(); // note: shift is O(N) on array',
    },
    {
      title: 'Double-Ended Queue (Deque)',
      time: 'O(1) on both ends',
      python: 'from collections import deque\ndq = deque()\ndq.append(x)      # push back\ndq.appendleft(x)  # push front\nx = dq.pop()      # pop back\nx = dq.popleft()  # pop front',
      java: 'Deque<Integer> dq = new ArrayDeque<>();\ndq.offerLast(x);   // push back\ndq.offerFirst(x);  // push front\nint r = dq.pollLast();  // pop back\nint l = dq.pollFirst(); // pop front',
      cpp: '#include <deque>\ndeque<int> dq;\ndq.push_back(x);\ndq.push_front(x);\ndq.pop_back();\ndq.pop_front();',
      javascript: 'const dq = [];\ndq.push(x);    // push back\ndq.unshift(x); // push front\ndq.pop();      // pop back\ndq.shift();    // pop front',
    },
    {
      title: 'Monotonic Deque (Sliding Window Maximum)',
      time: 'O(N), Space: O(K)',
      python: 'from collections import deque\ndq = deque()  # stores indices\nres = []\nfor i, num in enumerate(nums):\n    if dq and dq[0] < i - k + 1:\n        dq.popleft()  # remove out of window\n    while dq and nums[dq[-1]] < num:\n        dq.pop()      # maintain decreasing order\n    dq.append(i)\n    if i >= k - 1:\n        res.append(nums[dq[0]])',
      java: 'Deque<Integer> dq = new ArrayDeque<>();\nint[] res = new int[nums.length - k + 1];\nfor (int i = 0; i < nums.length; i++) {\n    if (!dq.isEmpty() && dq.peekFirst() < i - k + 1) dq.pollFirst();\n    while (!dq.isEmpty() && nums[dq.peekLast()] < nums[i]) dq.pollLast();\n    dq.offerLast(i);\n    if (i >= k - 1) res[i - k + 1] = nums[dq.peekFirst()];\n}',
      cpp: 'deque<int> dq;\nvector<int> res;\nfor (int i = 0; i < nums.size(); ++i) {\n    if (!dq.empty() && dq.front() < i - k + 1) dq.pop_front();\n    while (!dq.empty() && nums[dq.back()] < nums[i]) dq.pop_back();\n    dq.push_back(i);\n    if (i >= k - 1) res.push_back(nums[dq.front()]);\n}',
      javascript: 'const dq = [];\nconst res = [];\nfor (let i = 0; i < nums.length; i++) {\n  if (dq.length && dq[0] < i - k + 1) dq.shift();\n  while (dq.length && nums[dq[dq.length - 1]] < nums[i]) dq.pop();\n  dq.push(i);\n  if (i >= k - 1) res.push(nums[dq[0]]);\n}',
    },
  ],
  'Linked Lists': [
    {
      title: 'ListNode Node Class Definition',
      time: 'O(1)',
      python: 'class ListNode:\n    def __init__(self, val=0, next=None):\n        self.val = val\n        self.next = next',
      java: 'class ListNode {\n    int val;\n    ListNode next;\n    ListNode() {}\n    ListNode(int val) { this.val = val; }\n    ListNode(int val, ListNode next) { this.val = val; this.next = next; }\n}',
      cpp: 'struct ListNode {\n    int val;\n    ListNode *next;\n    ListNode() : val(0), next(nullptr) {}\n    ListNode(int x) : val(x), next(nullptr) {}\n    ListNode(int x, ListNode *next) : val(x), next(next) {}\n};',
      javascript: 'function ListNode(val, next) {\n  this.val = (val === undefined ? 0 : val);\n  this.next = (next === undefined ? null : next);\n}',
    },
    {
      title: 'Reverse Linked List (Iterative)',
      time: 'O(N), Space: O(1)',
      python: 'prev = None\ncurr = head\nwhile curr:\n    nxt = curr.next\n    curr.next = prev\n    prev = curr\n    curr = nxt\nreturn prev',
      java: 'ListNode prev = null;\nListNode curr = head;\nwhile (curr != null) {\n    ListNode nxt = curr.next;\n    curr.next = prev;\n    prev = curr;\n    curr = nxt;\n}\nreturn prev;',
      cpp: 'ListNode* prev = nullptr;\nListNode* curr = head;\nwhile (curr) {\n    ListNode* nxt = curr->next;\n    curr->next = prev;\n    prev = curr;\n    curr = nxt;\n}\nreturn prev;',
      javascript: 'let prev = null;\nlet curr = head;\nwhile (curr) {\n  const nxt = curr.next;\n  curr.next = prev;\n  prev = curr;\n  curr = nxt;\n}\nreturn prev;',
    },
    {
      title: 'Fast & Slow Pointer (Find Middle Node)',
      time: 'O(N), Space: O(1)',
      python: 'slow = fast = head\nwhile fast and fast.next:\n    slow = slow.next\n    fast = fast.next.next\nreturn slow  # middle node',
      java: 'ListNode slow = head, fast = head;\nwhile (fast != null && fast.next != null) {\n    slow = slow.next;\n    fast = fast.next.next;\n}\nreturn slow;',
      cpp: 'ListNode* slow = head;\nListNode* fast = head;\nwhile (fast && fast->next) {\n    slow = slow->next;\n    fast = fast->next->next;\n}\nreturn slow;',
      javascript: 'let slow = head, fast = head;\nwhile (fast && fast.next) {\n  slow = slow.next;\n  fast = fast.next.next;\n}\nreturn slow;',
    },
    {
      title: 'Floyd\'s Cycle Detection (Detect & Find Cycle Start)',
      time: 'O(N), Space: O(1)',
      python: 'slow = fast = head\nwhile fast and fast.next:\n    slow = slow.next\n    fast = fast.next.next\n    if slow == fast:\n        # cycle detected, find entry point\n        entry = head\n        while entry != slow:\n            entry = entry.next\n            slow = slow.next\n        return entry\nreturn None',
      java: 'ListNode slow = head, fast = head;\nwhile (fast != null && fast.next != null) {\n    slow = slow.next;\n    fast = fast.next.next;\n    if (slow == fast) {\n        ListNode entry = head;\n        while (entry != slow) {\n            entry = entry.next;\n            slow = slow.next;\n        }\n        return entry;\n    }\n}\nreturn null;',
      cpp: 'ListNode* slow = head; ListNode* fast = head;\nwhile (fast && fast->next) {\n    slow = slow->next;\n    fast = fast->next->next;\n    if (slow == fast) {\n        ListNode* entry = head;\n        while (entry != slow) {\n            entry = entry->next;\n            slow = slow->next;\n        }\n        return entry;\n    }\n}\nreturn nullptr;',
      javascript: 'let slow = head, fast = head;\nwhile (fast && fast.next) {\n  slow = slow.next;\n  fast = fast.next.next;\n  if (slow === fast) {\n    let entry = head;\n    while (entry !== slow) {\n      entry = entry.next;\n      slow = slow.next;\n    }\n    return entry;\n  }\n}\nreturn null;',
    },
    {
      title: 'Merge Two Sorted Linked Lists',
      time: 'O(N + M), Space: O(1)',
      python: 'dummy = ListNode(0)\ncurr = dummy\nwhile l1 and l2:\n    if l1.val <= l2.val:\n        curr.next = l1\n        l1 = l1.next\n    else:\n        curr.next = l2\n        l2 = l2.next\n    curr = curr.next\ncurr.next = l1 if l1 else l2\nreturn dummy.next',
      java: 'ListNode dummy = new ListNode(0);\nListNode curr = dummy;\nwhile (l1 != null && l2 != null) {\n    if (l1.val <= l2.val) { curr.next = l1; l1 = l1.next; }\n    else { curr.next = l2; l2 = l2.next; }\n    curr = curr.next;\n}\ncurr.next = (l1 != null) ? l1 : l2;\nreturn dummy.next;',
      cpp: 'ListNode dummy(0);\nListNode* curr = &dummy;\nwhile (l1 && l2) {\n    if (l1->val <= l2->val) { curr->next = l1; l1 = l1->next; }\n    else { curr->next = l2; l2 = l2->next; }\n    curr = curr->next;\n}\ncurr->next = l1 ? l1 : l2;\nreturn dummy.next;',
      javascript: 'const dummy = new ListNode(0);\nlet curr = dummy;\nwhile (l1 && l2) {\n  if (l1.val <= l2.val) { curr.next = l1; l1 = l1.next; }\n  else { curr.next = l2; l2 = l2.next; }\n  curr = curr.next;\n}\ncurr.next = l1 || l2;\nreturn dummy.next;',
    },
  ],
  'Binary Trees (Pre, In, Post, Level-Order)': [
    {
      title: 'TreeNode Node Class Definition',
      time: 'O(1)',
      python: 'class TreeNode:\n    def __init__(self, val=0, left=None, right=None):\n        self.val = val\n        self.left = left\n        self.right = right',
      java: 'class TreeNode {\n    int val;\n    TreeNode left, right;\n    TreeNode(int val) { this.val = val; }\n}',
      cpp: 'struct TreeNode {\n    int val;\n    TreeNode *left, *right;\n    TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}\n};',
      javascript: 'function TreeNode(val, left, right) {\n  this.val = (val === undefined ? 0 : val);\n  this.left = (left === undefined ? null : left);\n  this.right = (right === undefined ? null : right);\n}',
    },
    {
      title: 'Pre-Order Traversal (Root -> Left -> Right)',
      time: 'O(N), Space: O(H)',
      python: 'res = []\ndef preorder(root):\n    if not root: return\n    res.append(root.val)\n    preorder(root.left)\n    preorder(root.right)\npreorder(root)',
      java: 'List<Integer> res = new ArrayList<>();\nvoid preorder(TreeNode root) {\n    if (root == null) return;\n    res.add(root.val);\n    preorder(root.left);\n    preorder(root.right);\n}',
      cpp: 'vector<int> res;\nvoid preorder(TreeNode* root) {\n    if (!root) return;\n    res.push_back(root->val);\n    preorder(root->left);\n    preorder(root->right);\n}',
      javascript: 'const res = [];\nfunction preorder(root) {\n  if (!root) return;\n  res.push(root.val);\n  preorder(root.left);\n  preorder(root.right);\n}\npreorder(root);',
    },
    {
      title: 'In-Order Traversal (Left -> Root -> Right / BST Sorted)',
      time: 'O(N), Space: O(H)',
      python: 'res = []\ndef inorder(root):\n    if not root: return\n    inorder(root.left)\n    res.append(root.val)\n    inorder(root.right)\ninorder(root)',
      java: 'List<Integer> res = new ArrayList<>();\nvoid inorder(TreeNode root) {\n    if (root == null) return;\n    inorder(root.left);\n    res.add(root.val);\n    inorder(root.right);\n}',
      cpp: 'vector<int> res;\nvoid inorder(TreeNode* root) {\n    if (!root) return;\n    inorder(root->left);\n    res.push_back(root->val);\n    inorder(root->right);\n}',
      javascript: 'const res = [];\nfunction inorder(root) {\n  if (!root) return;\n  inorder(root.left);\n  res.push(root.val);\n  inorder(root.right);\n}\ninorder(root);',
    },
    {
      title: 'Post-Order Traversal (Left -> Right -> Root)',
      time: 'O(N), Space: O(H)',
      python: 'res = []\ndef postorder(root):\n    if not root: return\n    postorder(root.left)\n    postorder(root.right)\n    res.append(root.val)\npostorder(root)',
      java: 'List<Integer> res = new ArrayList<>();\nvoid postorder(TreeNode root) {\n    if (root == null) return;\n    postorder(root.left);\n    postorder(root.right);\n    res.add(root.val);\n}',
      cpp: 'vector<int> res;\nvoid postorder(TreeNode* root) {\n    if (!root) return;\n    postorder(root->left);\n    postorder(root->right);\n    res.push_back(root->val);\n}',
      javascript: 'const res = [];\nfunction postorder(root) {\n  if (!root) return;\n  postorder(root.left);\n  postorder(root.right);\n  res.push(root.val);\n}\npostorder(root);',
    },
    {
      title: 'Level-Order Traversal (BFS with Queue)',
      time: 'O(N), Space: O(N)',
      python: 'from collections import deque\nif not root: return []\nq = deque([root])\nlevels = []\nwhile q:\n    level = []\n    for _ in range(len(q)):\n        node = q.popleft()\n        level.append(node.val)\n        if node.left: q.append(node.left)\n        if node.right: q.append(node.right)\n    levels.append(level)',
      java: 'List<List<Integer>> levels = new ArrayList<>();\nif (root == null) return levels;\nQueue<TreeNode> q = new LinkedList<>();\nq.offer(root);\nwhile (!q.isEmpty()) {\n    int size = q.size();\n    List<Integer> level = new ArrayList<>();\n    for (int i = 0; i < size; i++) {\n        TreeNode node = q.poll();\n        level.add(node.val);\n        if (node.left != null) q.offer(node.left);\n        if (node.right != null) q.offer(node.right);\n    }\n    levels.add(level);\n}',
      cpp: 'vector<vector<int>> levels;\nif (!root) return levels;\nqueue<TreeNode*> q;\nq.push(root);\nwhile (!q.empty()) {\n    int sz = q.size();\n    vector<int> level;\n    for (int i = 0; i < sz; ++i) {\n        TreeNode* node = q.front(); q.pop();\n        level.push_back(node->val);\n        if (node->left) q.push(node->left);\n        if (node->right) q.push(node->right);\n    }\n    levels.push_back(level);\n}',
      javascript: 'const levels = [];\nif (!root) return levels;\nconst q = [root];\nwhile (q.length) {\n  const sz = q.length;\n  const level = [];\n  for (let i = 0; i < sz; i++) {\n    const node = q.shift();\n    level.push(node.val);\n    if (node.left) q.push(node.left);\n    if (node.right) q.push(node.right);\n  }\n  levels.push(level);\n}',
    },
    {
      title: 'Tree Height / Maximum Depth',
      time: 'O(N), Space: O(H)',
      python: 'def maxDepth(root):\n    if not root: return 0\n    return 1 + max(maxDepth(root.left), maxDepth(root.right))',
      java: 'public int maxDepth(TreeNode root) {\n    if (root == null) return 0;\n    return 1 + Math.max(maxDepth(root.left), maxDepth(root.right));\n}',
      cpp: 'int maxDepth(TreeNode* root) {\n    if (!root) return 0;\n    return 1 + max(maxDepth(root->left), maxDepth(root->right));\n}',
      javascript: 'function maxDepth(root) {\n  if (!root) return 0;\n  return 1 + Math.max(maxDepth(root.left), maxDepth(root.right));\n}',
    },
    {
      title: 'Lowest Common Ancestor (LCA in Binary Tree)',
      time: 'O(N), Space: O(H)',
      python: 'def lowestCommonAncestor(root, p, q):\n    if not root or root == p or root == q: return root\n    left = lowestCommonAncestor(root.left, p, q)\n    right = lowestCommonAncestor(root.right, p, q)\n    if left and right: return root\n    return left if left else right',
      java: 'public TreeNode lowestCommonAncestor(TreeNode root, TreeNode p, TreeNode q) {\n    if (root == null || root == p || root == q) return root;\n    TreeNode left = lowestCommonAncestor(root.left, p, q);\n    TreeNode right = lowestCommonAncestor(root.right, p, q);\n    if (left != null && right != null) return root;\n    return left != null ? left : right;\n}',
      cpp: 'TreeNode* lowestCommonAncestor(TreeNode* root, TreeNode* p, TreeNode* q) {\n    if (!root || root == p || root == q) return root;\n    TreeNode* left = lowestCommonAncestor(root->left, p, q);\n    TreeNode* right = lowestCommonAncestor(root->right, p, q);\n    if (left && right) return root;\n    return left ? left : right;\n}',
      javascript: 'function lowestCommonAncestor(root, p, q) {\n  if (!root || root === p || root === q) return root;\n  const left = lowestCommonAncestor(root.left, p, q);\n  const right = lowestCommonAncestor(root.right, p, q);\n  if (left && right) return root;\n  return left ? left : right;\n}',
    },
  ],
  'Graphs (BFS, DFS, TopoSort, Dijkstra)': [
    {
      title: 'Graph Adjacency List Construction',
      time: 'O(V + E)',
      python: 'from collections import defaultdict\nadj = defaultdict(list)\nfor u, v in edges:\n    adj[u].append(v)\n    adj[v].append(u)  # if undirected',
      java: 'List<List<Integer>> adj = new ArrayList<>();\nfor (int i = 0; i < n; i++) adj.add(new ArrayList<>());\nfor (int[] e : edges) {\n    adj.get(e[0]).add(e[1]);\n    adj.get(e[1]).add(e[0]);\n}',
      cpp: 'vector<vector<int>> adj(n);\nfor (const auto& e : edges) {\n    adj[e[0]].push_back(e[1]);\n    adj[e[1]].push_back(e[0]);\n}',
      javascript: 'const adj = Array.from({ length: n }, () => []);\nfor (const [u, v] of edges) {\n  adj[u].push(v);\n  adj[v].push(u);\n}',
    },
    {
      title: 'Breadth-First Search (BFS Shortest Path)',
      time: 'O(V + E), Space: O(V)',
      python: 'from collections import deque\nq = deque([(src, 0)])\nvisited = {src}\nwhile q:\n    node, dist = q.popleft()\n    if node == dest: return dist\n    for neighbor in adj[node]:\n        if neighbor not in visited:\n            visited.add(neighbor)\n            q.append((neighbor, dist + 1))',
      java: 'Queue<int[]> q = new LinkedList<>();\nboolean[] visited = new boolean[n];\nq.offer(new int[]{src, 0});\nvisited[src] = true;\nwhile (!q.isEmpty()) {\n    int[] curr = q.poll();\n    int node = curr[0], dist = curr[1];\n    if (node == dest) return dist;\n    for (int nxt : adj.get(node)) {\n        if (!visited[nxt]) {\n            visited[nxt] = true;\n            q.offer(new int[]{nxt, dist + 1});\n        }\n    }\n}',
      cpp: 'queue<pair<int, int>> q;\nvector<bool> visited(n, false);\nq.push({src, 0});\nvisited[src] = true;\nwhile (!q.empty()) {\n    auto [node, dist] = q.front(); q.pop();\n    if (node == dest) return dist;\n    for (int nxt : adj[node]) {\n        if (!visited[nxt]) {\n            visited[nxt] = true;\n            q.push({nxt, dist + 1});\n        }\n    }\n}',
      javascript: 'const q = [[src, 0]];\nconst visited = new Set([src]);\nwhile (q.length) {\n  const [node, dist] = q.shift();\n  if (node === dest) return dist;\n  for (const nxt of adj[node]) {\n    if (!visited.has(nxt)) {\n      visited.add(nxt);\n      q.push([nxt, dist + 1]);\n    }\n  }\n}',
    },
    {
      title: 'Depth-First Search (DFS Traversal)',
      time: 'O(V + E), Space: O(V)',
      python: 'visited = set()\ndef dfs(node):\n    visited.add(node)\n    for nxt in adj[node]:\n        if nxt not in visited:\n            dfs(nxt)\ndfs(src)',
      java: 'boolean[] visited = new boolean[n];\nvoid dfs(int node) {\n    visited[node] = true;\n    for (int nxt : adj.get(node)) {\n        if (!visited[nxt]) dfs(nxt);\n    }\n}',
      cpp: 'vector<bool> visited(n, false);\nvoid dfs(int node) {\n    visited[node] = true;\n    for (int nxt : adj[node]) {\n        if (!visited[nxt]) dfs(nxt);\n    }\n}',
      javascript: 'const visited = new Set();\nfunction dfs(node) {\n  visited.add(node);\n  for (const nxt of adj[node]) {\n    if (!visited.has(nxt)) dfs(nxt);\n  }\n}\ndfs(src);',
    },
    {
      title: 'Topological Sort (Kahn\'s Algorithm)',
      time: 'O(V + E), Space: O(V)',
      python: 'from collections import deque\nin_degree = [0] * n\nfor u in adj:\n    for v in adj[u]: in_degree[v] += 1\nq = deque([i for i in range(n) if in_degree[i] == 0])\norder = []\nwhile q:\n    node = q.popleft()\n    order.append(node)\n    for nxt in adj[node]:\n        in_degree[nxt] -= 1\n        if in_degree[nxt] == 0: q.append(nxt)\nreturn order if len(order) == n else []  # empty if cycle detected',
      java: 'int[] inDegree = new int[n];\nfor (int u = 0; u < n; u++) {\n    for (int v : adj.get(u)) inDegree[v]++;\n}\nQueue<Integer> q = new LinkedList<>();\nfor (int i = 0; i < n; i++) if (inDegree[i] == 0) q.offer(i);\nList<Integer> order = new ArrayList<>();\nwhile (!q.isEmpty()) {\n    int node = q.poll();\n    order.add(node);\n    for (int nxt : adj.get(node)) {\n        if (--inDegree[nxt] == 0) q.offer(nxt);\n    }\n}\nreturn order.size() == n ? order : new ArrayList<>();',
      cpp: 'vector<int> inDegree(n, 0);\nfor (int u = 0; u < n; ++u) for (int v : adj[u]) inDegree[v]++;\nqueue<int> q;\nfor (int i = 0; i < n; ++i) if (inDegree[i] == 0) q.push(i);\nvector<int> order;\nwhile (!q.empty()) {\n    int node = q.front(); q.pop();\n    order.push_back(node);\n    for (int nxt : adj[node]) {\n        if (--inDegree[nxt] == 0) q.push(nxt);\n    }\n}\nreturn order.size() == n ? order : vector<int>();',
      javascript: 'const inDegree = new Array(n).fill(0);\nfor (let u = 0; u < n; u++) for (const v of adj[u]) inDegree[v]++;\nconst q = [];\nfor (let i = 0; i < n; i++) if (inDegree[i] === 0) q.push(i);\nconst order = [];\nwhile (q.length) {\n  const node = q.shift();\n  order.push(node);\n  for (const nxt of adj[node]) {\n    if (--inDegree[nxt] === 0) q.push(nxt);\n  }\n}\nreturn order.length === n ? order : [];',
    },
    {
      title: 'Dijkstra\'s Shortest Path Algorithm',
      time: 'O((V + E) log V)',
      python: 'import heapq\ndist = [float("inf")] * n\ndist[src] = 0\npq = [(0, src)]  # (weight, node)\nwhile pq:\n    d, u = heapq.heappop(pq)\n    if d > dist[u]: continue\n    for v, weight in adj[u]:\n        if dist[u] + weight < dist[v]:\n            dist[v] = dist[u] + weight\n            heapq.heappush(pq, (dist[v], v))',
      java: 'int[] dist = new int[n];\nArrays.fill(dist, Integer.MAX_VALUE);\ndist[src] = 0;\nPriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> a[0] - b[0]);\npq.offer(new int[]{0, src});\nwhile (!pq.isEmpty()) {\n    int[] curr = pq.poll();\n    int d = curr[0], u = curr[1];\n    if (d > dist[u]) continue;\n    for (int[] edge : adj.get(u)) {\n        int v = edge[0], weight = edge[1];\n        if (dist[u] + weight < dist[v]) {\n            dist[v] = dist[u] + weight;\n            pq.offer(new int[]{dist[v], v});\n        }\n    }\n}',
      cpp: 'vector<int> dist(n, 1e9);\ndist[src] = 0;\npriority_queue<pair<int, int>, vector<pair<int, int>>, greater<>> pq;\npq.push({0, src});\nwhile (!pq.empty()) {\n    auto [d, u] = pq.top(); pq.pop();\n    if (d > dist[u]) continue;\n    for (auto& [v, weight] : adj[u]) {\n        if (dist[u] + weight < dist[v]) {\n            dist[v] = dist[u] + weight;\n            pq.push({dist[v], v});\n        }\n    }\n}',
      javascript: '// Using Min Priority Queue on (dist, node)\nconst dist = new Array(n).fill(Infinity);\ndist[src] = 0;\nconst pq = [[0, src]];\nwhile (pq.length) {\n  pq.sort((a, b) => a[0] - b[0]);\n  const [d, u] = pq.shift();\n  if (d > dist[u]) continue;\n  for (const [v, weight] of adj[u]) {\n    if (dist[u] + weight < dist[v]) {\n      dist[v] = dist[u] + weight;\n      pq.push([dist[v], v]);\n    }\n  }\n}',
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
      cpp: 'priority_queue<int> maxPq; // default in C++ is max-heap\nmaxPq.push(val);\nint maxVal = maxPq.top();\nmaxPq.pop();',
      javascript: '// Max Heap stores largest elements at root\nclass MaxHeap { /* push, pop, peek */ }',
    },
    {
      title: 'Top K Frequent Elements Pattern',
      time: 'O(N log K), Space: O(N + K)',
      python: 'import heapq\nfrom collections import Counter\ncount = Counter(nums)\nreturn heapq.nlargest(k, count.keys(), key=count.get)',
      java: 'Map<Integer, Integer> count = new HashMap<>();\nfor (int n : nums) count.put(n, count.getOrDefault(n, 0) + 1);\nPriorityQueue<Integer> pq = new PriorityQueue<>((a, b) -> count.get(a) - count.get(b));\nfor (int n : count.keySet()) {\n    pq.offer(n);\n    if (pq.size() > k) pq.poll();\n}',
      cpp: 'unordered_map<int, int> count;\nfor (int n : nums) count[n]++;\npriority_queue<pair<int, int>, vector<pair<int, int>>, greater<>> pq;\nfor (auto& [val, freq] : count) {\n    pq.push({freq, val});\n    if (pq.size() > k) pq.pop();\n}',
      javascript: 'const count = new Map();\nfor (const n of nums) count.set(n, (count.get(n) || 0) + 1);\nconst sorted = Array.from(count.entries()).sort((a, b) => b[1] - a[1]);\nreturn sorted.slice(0, k).map(([val]) => val);',
    },
  ],
  'Disjoint Set Union (DSU)': [
    {
      title: 'Disjoint Set Union (DSU / Union-Find with Path Compression)',
      time: 'O(alpha(N)) ≈ O(1)',
      python: 'parent = list(range(n))\nrank = [1] * n\n\ndef find(i):\n    if parent[i] != i:\n        parent[i] = find(parent[i])\n    return parent[i]\n\ndef union(i, j):\n    root_i, root_j = find(i), find(j)\n    if root_i == root_j: return False\n    if rank[root_i] < rank[root_j]:\n        root_i, root_j = root_j, root_i\n    parent[root_j] = root_i\n    rank[root_i] += rank[root_j]\n    return True',
      java: 'class DSU {\n    int[] parent, rank;\n    public DSU(int n) {\n        parent = new int[n];\n        rank = new int[n];\n        for (int i = 0; i < n; i++) { parent[i] = i; rank[i] = 1; }\n    }\n    public int find(int i) {\n        if (parent[i] != i) parent[i] = find(parent[i]);\n        return parent[i];\n    }\n    public boolean union(int i, int j) {\n        int rootI = find(i), rootJ = find(j);\n        if (rootI == rootJ) return false;\n        if (rank[rootI] < rank[rootJ]) { int tmp = rootI; rootI = rootJ; rootJ = tmp; }\n        parent[rootJ] = rootI;\n        rank[rootI] += rank[rootJ];\n        return true;\n    }\n}',
      cpp: 'struct DSU {\n    vector<int> parent, rank;\n    DSU(int n) : parent(n), rank(n, 1) {\n        iota(parent.begin(), parent.end(), 0);\n    }\n    int find(int i) {\n        if (parent[i] != i) parent[i] = find(parent[i]);\n        return parent[i];\n    }\n    bool unite(int i, int j) {\n        int rootI = find(i), rootJ = find(j);\n        if (rootI == rootJ) return false;\n        if (rank[rootI] < rank[rootJ]) swap(rootI, rootJ);\n        parent[rootJ] = rootI;\n        rank[rootI] += rank[rootJ];\n        return true;\n    }\n};',
      javascript: 'class DSU {\n  constructor(n) {\n    this.parent = Array.from({ length: n }, (_, i) => i);\n    this.rank = new Array(n).fill(1);\n  }\n  find(i) {\n    if (this.parent[i] !== i) this.parent[i] = this.find(this.parent[i]);\n    return this.parent[i];\n  }\n  union(i, j) {\n    let rootI = this.find(i), rootJ = this.find(j);\n    if (rootI === rootJ) return false;\n    if (this.rank[rootI] < this.rank[rootJ]) [rootI, rootJ] = [rootJ, rootI];\n    this.parent[rootJ] = rootI;\n    this.rank[rootI] += this.rank[rootJ];\n    return true;\n  }\n}',
    },
  ],
  'Binary Search & Bounds': [
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
    {
      title: 'Binary Search on Answer Space (Predicate)',
      time: 'O(log(Range) * checkTime)',
      python: 'def isValid(mid):\n    # evaluate condition\n    return True\n\nl, r = min_ans, max_ans\nans = r\nwhile l <= r:\n    mid = l + (r - l) // 2\n    if isValid(mid):\n        ans = mid\n        r = mid - 1  # search for smaller valid answer\n    else:\n        l = mid + 1\nreturn ans',
      java: 'int l = minAns, r = maxAns, ans = r;\nwhile (l <= r) {\n    int mid = l + (r - l) / 2;\n    if (isValid(mid)) {\n        ans = mid;\n        r = mid - 1;\n    } else {\n        l = mid + 1;\n    }\n}\nreturn ans;',
      cpp: 'int l = minAns, r = maxAns, ans = r;\nwhile (l <= r) {\n    int mid = l + (r - l) / 2;\n    if (isValid(mid)) {\n        ans = mid;\n        r = mid - 1;\n    } else {\n        l = mid + 1;\n    }\n}\nreturn ans;',
      javascript: 'let l = minAns, r = maxAns, ans = r;\nwhile (l <= r) {\n  const mid = l + Math.floor((r - l) / 2);\n  if (isValid(mid)) {\n    ans = mid;\n    r = mid - 1;\n  } else {\n    l = mid + 1;\n  }\n}\nreturn ans;',
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
    {
      title: '8-Directional Grid Moves (with Diagonals)',
      time: 'O(1)',
      python: 'dirs = [(-1, -1), (-1, 0), (-1, 1), (0, -1), (0, 1), (1, -1), (1, 0), (1, 1)]\nfor dr, dc in dirs:\n    nr, nc = r + dr, c + dc\n    if 0 <= nr < n and 0 <= nc < m:\n        pass',
      java: 'int[][] dirs = {{-1,-1},{-1,0},{-1,1},{0,-1},{0,1},{1,-1},{1,0},{1,1}};\nfor (int[] d : dirs) {\n    int nr = r + d[0], nc = c + d[1];\n    if (nr >= 0 && nr < n && nc >= 0 && nc < m) { /* in-bounds */ }\n}',
      cpp: 'int dirs[8][2] = {{-1,-1},{-1,0},{-1,1},{0,-1},{0,1},{1,-1},{1,0},{1,1}};\nfor (auto& d : dirs) {\n    int nr = r + d[0], nc = c + d[1];\n    if (nr >= 0 && nr < n && nc >= 0 && nc < m) { /* in-bounds */ }\n}',
      javascript: 'const dirs = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];\nfor (const [dr, dc] of dirs) {\n  const nr = r + dr, nc = c + dc;\n  if (nr >= 0 && nr < n && nc >= 0 && nc < m) { /* in-bounds */ }\n}',
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
