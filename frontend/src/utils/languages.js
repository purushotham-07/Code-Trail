// Canonical language definitions and taxonomies for DSA & SQL Platform

export const DSA_LANGUAGES = [
  { id: 'python', label: 'Python 3', ext: 'py', color: '#3572A5' },
  { id: 'java', label: 'Java', ext: 'java', color: '#b07219' },
  { id: 'cpp', label: 'C++', ext: 'cpp', color: '#f34b7d' },
  { id: 'javascript', label: 'JavaScript', ext: 'js', color: '#f1e05a' },
];

export const SQL_LANGUAGES = [
  { id: 'sql', label: 'SQL', ext: 'sql', color: '#e38c00' },
];

export const ALL_SUPPORTED_LANGUAGES = [
  'python',
  'java',
  'cpp',
  'c++',
  'javascript',
  'sql',
];

export const LANGUAGES = ALL_SUPPORTED_LANGUAGES;

export const DSA_TOPICS = [
  'Arrays & Hashing',
  'Two Pointers',
  'Sliding Window',
  'Stack & Monotonic Stack',
  'Binary Search',
  'Linked List',
  'Trees & BST',
  'Tries',
  'Heap & Priority Queue',
  'Backtracking',
  'Graphs (BFS/DFS)',
  'Dynamic Programming',
  'Greedy',
  'Bit Manipulation',
  'Math & Geometry',
];

export const SQL_TOPICS = [
  'Window Functions',
  'CTEs & Recursive Queries',
  'Multi-Table Joins',
  'Aggregations & Grouping',
  'Subqueries & Correlated',
  'Ranking & Partitioning',
  'Date & Time Manipulation',
  'String & Regex Operations',
  'Schema & Index Design',
];

export const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

export const SQL_DIALECTS = [
  { id: 'standard', label: 'Standard SQL' },
  { id: 'postgresql', label: 'PostgreSQL' },
  { id: 'mysql', label: 'MySQL' },
  { id: 'sqlite', label: 'SQLite' },
];

// Predefined Target Complexity Lists for Dropdown Selection
export const TIME_COMPLEXITY_OPTIONS = [
  { value: 'O(1)', label: 'O(1) - Constant' },
  { value: 'O(log n)', label: 'O(log n) - Logarithmic' },
  { value: 'O(n)', label: 'O(n) - Linear' },
  { value: 'O(n log n)', label: 'O(n log n) - Linearithmic' },
  { value: 'O(n^2)', label: 'O(n²) - Quadratic' },
  { value: 'O(n^3)', label: 'O(n³) - Cubic' },
  { value: 'O(2^n)', label: 'O(2ⁿ) - Exponential' },
  { value: 'O(n!)', label: 'O(n!) - Factorial' },
];

export const SPACE_COMPLEXITY_OPTIONS = [
  { value: 'O(1)', label: 'O(1) - Constant Auxiliary Space' },
  { value: 'O(log n)', label: 'O(log n) - Logarithmic Space' },
  { value: 'O(n)', label: 'O(n) - Linear Auxiliary Space' },
  { value: 'O(n log n)', label: 'O(n log n)' },
  { value: 'O(n^2)', label: 'O(n²) - 2D Matrix / Grid' },
  { value: 'O(n * m)', label: 'O(n * m) - 2D DP Grid' },
  { value: 'O(k)', label: 'O(k) - Window / Top K Elements' },
];

export const TOPIC_DEFAULT_TAGS = {
  'Two Pointers': ['two-pointers', 'array', 'sorted-array'],
  'Sliding Window': ['sliding-window', 'array', 'string', 'substring'],
  'Stack & Monotonic Stack': ['stack', 'monotonic-stack', 'next-greater-element'],
  'Binary Search': ['binary-search', 'array', 'logarithmic-time'],
  'Dynamic Programming': ['dynamic-programming', 'memoization', 'tabulation', 'dp'],
  'Heap & Priority Queue': ['heap', 'priority-queue', 'top-k', 'min-heap'],
  'Linked List': ['linked-list', 'two-pointers', 'fast-and-slow'],
  'Trees & BST': ['tree', 'binary-tree', 'binary-search-tree', 'dfs'],
  'Graphs (BFS/DFS)': ['graph', 'bfs', 'dfs', 'shortest-path'],
  'Backtracking': ['backtracking', 'recursion', 'permutations', 'subsets'],
  'Tries': ['trie', 'prefix-tree', 'string', 'autocomplete'],
  'Bit Manipulation': ['bit-manipulation', 'bitwise', 'xor', 'math'],
  'Greedy': ['greedy', 'sorting', 'optimization'],
  'Intervals': ['intervals', 'sorting', 'merge-intervals'],
  'Math & Geometry': ['math', 'geometry', 'number-theory'],
  'Arrays & Hashing': ['array', 'hash-table', 'hash-map', 'lookup'],
  // SQL
  'Window Functions': ['sql', 'window-functions', 'over-partition', 'ranking'],
  'CTEs & Recursive Queries': ['sql', 'cte', 'with-recursive', 'hierarchical'],
  'Multi-Table Joins': ['sql', 'joins', 'inner-join', 'left-join'],
  'Aggregations & Grouping': ['sql', 'group-by', 'having', 'aggregations'],
  'Ranking & Partitioning': ['sql', 'dense-rank', 'row-number', 'analytics'],
  'Date & Time Manipulation': ['sql', 'datetime', 'timestamps', 'intervals'],
  'Subqueries & Correlated': ['sql', 'subqueries', 'exists', 'in-clause'],
  'Schema & DDL': ['sql', 'ddl', 'constraints', 'indexes'],
};

// Smart Pattern & Tag Auto-detection based on problem statement keywords
export function detectTopicAndTags(text = '', domain = 'dsa') {
  const content = String(text || '').toLowerCase();
  if (!content || content.length < 3) {
    return { topic: null, tags: [] };
  }

  if (domain === 'sql') {
    if (
      content.includes('over (') ||
      content.includes('partition by') ||
      content.includes('lead(') ||
      content.includes('lag(') ||
      content.includes('window')
    ) {
      return { topic: 'Window Functions', tags: TOPIC_DEFAULT_TAGS['Window Functions'] };
    }
    if (content.includes('with recursive') || content.includes('cte') || content.includes('with ') || content.includes('common table expression')) {
      return { topic: 'CTEs & Recursive Queries', tags: TOPIC_DEFAULT_TAGS['CTEs & Recursive Queries'] };
    }
    if (content.includes('join') || content.includes('inner join') || content.includes('left join') || content.includes('cross join') || content.includes('foreign key')) {
      return { topic: 'Multi-Table Joins', tags: TOPIC_DEFAULT_TAGS['Multi-Table Joins'] };
    }
    if (content.includes('group by') || content.includes('having') || content.includes('count(') || content.includes('sum(') || content.includes('avg(') || content.includes('aggregate')) {
      return { topic: 'Aggregations & Grouping', tags: TOPIC_DEFAULT_TAGS['Aggregations & Grouping'] };
    }
    if (content.includes('dense_rank') || content.includes('row_number') || content.includes('ntile') || content.includes('rank()') || content.includes('top nth')) {
      return { topic: 'Ranking & Partitioning', tags: TOPIC_DEFAULT_TAGS['Ranking & Partitioning'] };
    }
    if (content.includes('date') || content.includes('interval') || content.includes('timestamp') || content.includes('datediff') || content.includes('now()')) {
      return { topic: 'Date & Time Manipulation', tags: TOPIC_DEFAULT_TAGS['Date & Time Manipulation'] };
    }
    if (content.includes('exists') || content.includes('correlated') || content.includes('subquery') || content.includes('where in')) {
      return { topic: 'Subqueries & Correlated', tags: TOPIC_DEFAULT_TAGS['Subqueries & Correlated'] };
    }
    return { topic: null, tags: [] };
  }

  // DSA Topic Detection
  if (
    content.includes('linked list') ||
    content.includes('listnode') ||
    content.includes('reverse list') ||
    content.includes('cycle in list') ||
    content.includes('merge two sorted lists') ||
    content.includes('reorder list')
  ) {
    return { topic: 'Linked List', tags: TOPIC_DEFAULT_TAGS['Linked List'] };
  }

  if (
    content.includes('binary tree') ||
    content.includes('treenode') ||
    content.includes('bst') ||
    content.includes('inorder') ||
    content.includes('level order') ||
    content.includes('lowest common ancestor') ||
    content.includes('invert tree') ||
    content.includes('max depth of binary tree') ||
    content.includes('diameter of tree')
  ) {
    return { topic: 'Trees & BST', tags: TOPIC_DEFAULT_TAGS['Trees & BST'] };
  }

  if (
    content.includes('dynamic programming') ||
    content.includes('knapsack') ||
    content.includes('longest common subsequence') ||
    content.includes('longest increasing subsequence') ||
    content.includes('climbing stairs') ||
    content.includes('coin change') ||
    content.includes('edit distance') ||
    content.includes('house robber') ||
    content.includes('word break') ||
    content.includes('unique paths') ||
    content.includes('memoization') ||
    content.includes('dp[')
  ) {
    return { topic: 'Dynamic Programming', tags: TOPIC_DEFAULT_TAGS['Dynamic Programming'] };
  }

  if (
    content.includes('graph') ||
    content.includes('shortest path') ||
    content.includes('dijkstra') ||
    content.includes('number of islands') ||
    content.includes('topological sort') ||
    content.includes('connected components') ||
    content.includes('course schedule') ||
    content.includes('clone graph') ||
    content.includes('pacific atlantic') ||
    content.includes('word ladder')
  ) {
    return { topic: 'Graphs (BFS/DFS)', tags: TOPIC_DEFAULT_TAGS['Graphs (BFS/DFS)'] };
  }

  if (
    content.includes('backtrack') ||
    content.includes('permutation') ||
    content.includes('subsets') ||
    content.includes('combination sum') ||
    content.includes('n-queens') ||
    content.includes('sudoku solver') ||
    content.includes('generate parentheses')
  ) {
    return { topic: 'Backtracking', tags: TOPIC_DEFAULT_TAGS['Backtracking'] };
  }

  if (
    content.includes('priority queue') ||
    content.includes('min heap') ||
    content.includes('max heap') ||
    content.includes('top k') ||
    content.includes('kth largest') ||
    content.includes('kth smallest') ||
    content.includes('median from data stream') ||
    content.includes('k closest') ||
    content.includes('heapq')
  ) {
    return { topic: 'Heap & Priority Queue', tags: TOPIC_DEFAULT_TAGS['Heap & Priority Queue'] };
  }

  if (
    content.includes('sliding window') ||
    content.includes('longest substring without repeating') ||
    content.includes('minimum window substring') ||
    content.includes('sliding window maximum') ||
    (content.includes('subarray') && (content.includes('contiguous') || content.includes('at most k') || content.includes('window size')))
  ) {
    return { topic: 'Sliding Window', tags: TOPIC_DEFAULT_TAGS['Sliding Window'] };
  }

  if (
    content.includes('monotonic stack') ||
    content.includes('next greater') ||
    content.includes('previous smaller') ||
    content.includes('largest rectangle in histogram') ||
    content.includes('daily temperatures') ||
    content.includes('valid parentheses') ||
    content.includes('min stack')
  ) {
    return { topic: 'Stack & Monotonic Stack', tags: TOPIC_DEFAULT_TAGS['Stack & Monotonic Stack'] };
  }

  if (
    content.includes('binary search') ||
    content.includes('bisect') ||
    content.includes('search in rotated') ||
    content.includes('search insert position') ||
    content.includes('find minimum in rotated') ||
    content.includes('koko eating bananas') ||
    content.includes('capacity to ship packages') ||
    content.includes('median of two sorted arrays')
  ) {
    return { topic: 'Binary Search', tags: TOPIC_DEFAULT_TAGS['Binary Search'] };
  }

  if (
    content.includes('two pointer') ||
    content.includes('2 pointer') ||
    content.includes('container with most water') ||
    content.includes('3sum') ||
    content.includes('two sum ii') ||
    content.includes('valid palindrome') ||
    content.includes('trapping rain water')
  ) {
    return { topic: 'Two Pointers', tags: TOPIC_DEFAULT_TAGS['Two Pointers'] };
  }

  if (
    content.includes('intervals') ||
    content.includes('merge intervals') ||
    content.includes('insert interval') ||
    content.includes('non-overlapping intervals') ||
    content.includes('meeting rooms')
  ) {
    return { topic: 'Intervals', tags: TOPIC_DEFAULT_TAGS['Intervals'] };
  }

  if (
    content.includes('trie') ||
    content.includes('prefix tree') ||
    content.includes('word search ii') ||
    content.includes('autocomplete')
  ) {
    return { topic: 'Tries', tags: TOPIC_DEFAULT_TAGS['Tries'] };
  }

  if (
    content.includes('bit manipulation') ||
    content.includes('bitwise') ||
    content.includes('single number') ||
    content.includes('number of 1 bits') ||
    content.includes('counting bits') ||
    content.includes('reverse bits') ||
    content.includes('xor')
  ) {
    return { topic: 'Bit Manipulation', tags: TOPIC_DEFAULT_TAGS['Bit Manipulation'] };
  }

  if (
    content.includes('greedy') ||
    content.includes('jump game') ||
    content.includes('gas station') ||
    content.includes('candy') ||
    content.includes('task scheduler')
  ) {
    return { topic: 'Greedy', tags: TOPIC_DEFAULT_TAGS['Greedy'] };
  }

  if (
    content.includes('two sum') ||
    content.includes('contains duplicate') ||
    content.includes('valid anagram') ||
    content.includes('group anagrams') ||
    content.includes('top k frequent') ||
    content.includes('product of array except self') ||
    content.includes('longest consecutive sequence') ||
    content.includes('hash map') ||
    content.includes('hash table') ||
    content.includes('hash set')
  ) {
    return { topic: 'Arrays & Hashing', tags: TOPIC_DEFAULT_TAGS['Arrays & Hashing'] };
  }

  return { topic: null, tags: [] };
}

// Progressive 3-Tier Hint Generator based on algorithmic patterns
export function generateTopicHints(topic = 'General', domain = 'dsa') {
  const top = String(topic || 'General').trim();
  if (domain === 'sql') {
    switch (top) {
      case 'Window Functions':
        return [
          'Hint 1 (Query Strategy): Use DENSE_RANK() or ROW_NUMBER() over an ORDER BY clause (e.g. DENSE_RANK() OVER (ORDER BY salary DESC)) to assign ranking metrics across rows.',
          'Hint 2 (Query Architecture): Window functions cannot be filtered directly in a WHERE clause. Wrap the window query inside a subquery or Common Table Expression (WITH CTE AS ...).',
          'Hint 3 (Edge Cases & Ties): If identical values exist (e.g. two employees with the same salary), decide whether they share the rank (DENSE_RANK) or get distinct sequential numbers (ROW_NUMBER).',
        ];
      case 'CTEs & Recursive Queries':
        return [
          'Hint 1 (Query Strategy): For Nth Highest Salary or Top-N filtering, either declare a CTE with DENSE_RANK() or decrement N (SET N = N - 1;) to use LIMIT 1 OFFSET N.',
          'Hint 2 (Function Syntax): When writing a MySQL/PostgreSQL function (CREATE FUNCTION ... BEGIN ... RETURN ( ... ); END), ensure the scalar query inside RETURN is wrapped in parentheses.',
          'Hint 3 (Edge Cases & NULL Handling): If fewer than N records exist, a subquery SELECT (SELECT DISTINCT salary ... LIMIT 1 OFFSET N) naturally evaluates to NULL instead of an empty set.',
        ];
      case 'Multi-Table Joins':
        return [
          'Hint 1 (Query Strategy): Determine if rows from the primary table must be retained even when no match exists (use LEFT JOIN) or if only matching pairs are required (use INNER JOIN).',
          'Hint 2 (Join Condition): Always specify explicit join predicates (ON table_a.id = table_b.foreign_id) to avoid Cartesian products.',
          'Hint 3 (Edge Cases & NULLs): When looking for records that do NOT exist in the secondary table, use LEFT JOIN ... WHERE table_b.id IS NULL.',
        ];
      case 'Aggregations & Grouping':
        return [
          'Hint 1 (Query Strategy): Remember the execution lifecycle: WHERE filters rows before aggregation; GROUP BY forms groups; HAVING filters aggregated results.',
          'Hint 2 (Group Invariant): Every non-aggregated column selected in the SELECT clause must appear in the GROUP BY clause.',
          'Hint 3 (Edge Cases & Distinct): Be careful with COUNT(column) vs COUNT(*). Use COUNT(DISTINCT column) when uniqueness is required across groups.',
        ];
      case 'Ranking & Partitioning':
        return [
          'Hint 1 (Query Strategy): Choose the exact ranking function: ROW_NUMBER() (unique 1,2,3), RANK() (gap on ties 1,2,2,4), or DENSE_RANK() (continuous on ties 1,2,2,3).',
          'Hint 2 (Partition Frame): When ranking within subgroups (e.g. highest salary per department), add PARTITION BY department_id to your OVER clause.',
          'Hint 3 (Edge Cases & Ties): Add secondary sort columns in ORDER BY to ensure deterministic tie-breaking.',
        ];
      case 'Date & Time Manipulation':
        return [
          'Hint 1 (Query Strategy): Use dialect date functions (DATEDIFF(d1, d2), DATE_ADD, or d1 - INTERVAL 1 DAY) to calculate time deltas.',
          'Hint 2 (Self-Joins): For consecutive date tracking (e.g. rising temperatures), join the table with itself ON DATEDIFF(t1.recordDate, t2.recordDate) = 1.',
          'Hint 3 (Edge Cases): Account for leap years, end-of-month rollovers, and dates that might not have consecutive day entries.',
        ];
      case 'Subqueries & Correlated':
        return [
          'Hint 1 (Query Strategy): Use WHERE EXISTS (SELECT 1 FROM ... WHERE ...) for fast existence checks that terminate on the first match.',
          'Hint 2 (Scalar Subqueries): Ensure scalar subqueries used in expressions evaluate to at most one row and one column.',
          'Hint 3 (Optimization): Avoid deeply nested correlated subqueries in large tables by rewriting them as JOINs or CTEs with indexes.',
        ];
      default:
        return [
          'Hint 1 (Clause Execution): Determine whether row-level filtering (WHERE) or group-level aggregation (GROUP BY / HAVING / WINDOW) should execute first.',
          'Hint 2 (Query Architecture): Utilize CTEs (WITH clause) or Window Functions to avoid repetitive subquery scans.',
          'Hint 3 (Optimization & NULLs): Test edge cases: empty tables, single-row inputs, duplicate values, and NULL handling.',
        ];
    }
  }

  switch (top) {
    case 'Two Pointers':
      return [
        'Hint 1 (Intuition): If the array is sorted or can be sorted, maintain two pointers (e.g. left at start and right at end) moving towards each other to eliminate nested loops.',
        'Hint 2 (Data Structure): No auxiliary data structure needed. Use two integer index variables (O(1) auxiliary space).',
        'Hint 3 (Algorithm & Edge Cases): While left < right, evaluate the condition. If sum is too small, advance left (left++); if too large, decrement right (right--). Beware duplicate elements!',
      ];
    case 'Sliding Window':
      return [
        'Hint 1 (Intuition): Maintain a contiguous window [left, right]. Expand right pointer to add new elements into the window state.',
        'Hint 2 (Data Structure): Use a Hash Map or frequency array to track element/character counts in the current window.',
        'Hint 3 (Algorithm & Edge Cases): When the window becomes invalid (e.g. unique count exceeds K or sum exceeds target), shrink left pointer (left++) until valid again while tracking max/min length.',
      ];
    case 'Stack & Monotonic Stack':
      return [
        'Hint 1 (Intuition): When you need to find the nearest greater/smaller element for every item, maintain a stack that preserves monotonic increasing or decreasing order.',
        'Hint 2 (Data Structure): Store array indices in the stack rather than values so you can calculate distances and boundaries.',
        'Hint 3 (Algorithm & Edge Cases): Iterate through the array. Before pushing index i, pop all stack elements that violate the monotonic invariant and process their answer.',
      ];
    case 'Binary Search':
      return [
        'Hint 1 (Intuition): If the answer space is monotonic (e.g. if answer X works, then all values >= X also work), you can binary search directly on the answer space.',
        'Hint 2 (Data Structure): Use low and high boundary integers with mid = low + (high - low) / 2 to avoid integer overflow.',
        'Hint 3 (Algorithm & Edge Cases): Write a helper function isValid(mid). If isValid(mid) is true, record mid as potential answer and narrow search space to find the optimal boundary.',
      ];
    case 'Dynamic Programming':
      return [
        'Hint 1 (Intuition): Identify overlapping subproblems and optimal substructure. Define what dp[i] (or dp[i][j]) represents in plain English.',
        'Hint 2 (Data Structure): Tabulation 1D/2D array or Memoization hash table / recursion cache.',
        'Hint 3 (Algorithm & Edge Cases): Determine base cases (e.g. dp[0] = 0 or 1) and recurrence transition from previous subproblem states. Can space be compressed from O(N*M) to O(M)?',
      ];
    case 'Heap & Priority Queue':
      return [
        'Hint 1 (Intuition): When tracking continuous Top K elements, dynamic medians, or greedy minimum costs, use a Priority Queue instead of sorting repeatedly.',
        'Hint 2 (Data Structure): Use a Min-Heap of size K to find K-th largest elements, or a Max-Heap to find K-th smallest.',
        'Hint 3 (Algorithm & Edge Cases): Push elements into heap. Whenever heap size exceeds K, pop the root. The top of the heap will be the K-th largest in O(N log K) time.',
      ];
    case 'Trees & BST':
      return [
        'Hint 1 (Intuition): Tree problems are naturally recursive. Formulate the solution by asking: "What information do I need from my left child and right child?"',
        'Hint 2 (Data Structure): Recursion call stack (DFS) or Queue (BFS level-order traversal).',
        'Hint 3 (Algorithm & Edge Cases): Always check the base case when node is null/None. In BST, utilize the binary search property (left.val < root.val < right.val).',
      ];
    case 'Graphs (BFS/DFS)':
      return [
        'Hint 1 (Intuition): For unweighted shortest path, use BFS (queue). For connected components, topological sort, or cycle detection, use DFS (recursion/stack).',
        'Hint 2 (Data Structure): Adjacency list Map<Node, List<Node>> and a visited Set/boolean array to prevent infinite cycles.',
        'Hint 3 (Algorithm & Edge Cases): Account for disconnected graph components by looping through all vertices (0 to n-1) and calling traversal on unvisited nodes.',
      ];
    default:
      return [
        'Hint 1 (Intuition): Analyze the problem constraints (N). If N <= 10^5, target O(N) or O(N log N) using hashing, sorting, or two pointers.',
        'Hint 2 (Data Structure): Consider using a Hash Map/Set for O(1) lookups to trade space for linear time complexity.',
        'Hint 3 (Algorithm & Edge Cases): Test edge cases: empty input, array with 1 or 2 elements, negative numbers, duplicates, and all identical values.',
      ];
  }
}

// Student mastery cheat sheet for common DSA patterns
export const DSA_PATTERN_GUIDE = {
  'Two Pointers': {
    invariant: 'Use two indices moving towards each other or in the same direction to eliminate nested scanning.',
    bestFor: 'Sorted arrays, pair sums, palindrome verification, partition problems.',
    timeSpace: 'Time: O(N), Space: O(1)',
  },
  'Sliding Window': {
    invariant: 'Maintain a valid window [L, R] of elements; expand R and conditionally shrink L.',
    bestFor: 'Subarrays/substrings with length or sum constraints, unique character windows.',
    timeSpace: 'Time: O(N), Space: O(K) where K is unique elements',
  },
  'Stack & Monotonic Stack': {
    invariant: 'Maintain elements in monotonic ascending or descending order to find next greater/smaller elements in linear time.',
    bestFor: 'Daily temperatures, histogram max rectangle, bracket matching, stock span.',
    timeSpace: 'Time: O(N), Space: O(N)',
  },
  'Binary Search': {
    invariant: 'Reduce search space by half at each step by comparing target with midpoint.',
    bestFor: 'Sorted collections, monotonic search spaces, minimize maximum problems.',
    timeSpace: 'Time: O(log N), Space: O(1)',
  },
  'Dynamic Programming': {
    invariant: 'Express solution as recurrence relation over overlapping subproblems with optimal substructure.',
    bestFor: 'Counting paths, min/max cost optimization, knapsack, subset partitions.',
    timeSpace: 'Time: O(N * M), Space: O(N * M) or compressed to O(M)',
  },
  'Heap & Priority Queue': {
    invariant: 'Maintain a partial ordering where root is always min or max in logarithmic insertions.',
    bestFor: 'Top K frequent, merge K sorted lists, median of stream, shortest path Dijkstra.',
    timeSpace: 'Time: O(N log K), Space: O(K)',
  },
};

export const STARTER_BOILERPLATES = {
  python: `class Solution:
    def solve(self, nums: list[int], target: int) -> list[int]:
        """
        Time Complexity: O(n)
        Space Complexity: O(n)
        """
        seen = {}
        for i, num in enumerate(nums):
            complement = target - num
            if complement in seen:
                return [seen[complement], i]
            seen[num] = i
        return []
`,
  java: `import java.util.*;

class Solution {
    /**
     * Time Complexity: O(n)
     * Space Complexity: O(n)
     */
    public int[] solve(int[] nums, int target) {
        Map<Integer, Integer> map = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int complement = target - nums[i];
            if (map.containsKey(complement)) {
                return new int[]{map.get(complement), i};
            }
            map.put(nums[i], i);
        }
        return new int[]{};
    }
}
`,
  cpp: `#include <iostream>
#include <vector>
#include <unordered_map>

using namespace std;

class Solution {
public:
    /**
     * Time Complexity: O(n)
     * Space Complexity: O(n)
     */
    vector<int> solve(vector<int>& nums, int target) {
        unordered_map<int, int> seen;
        for (int i = 0; i < nums.size(); ++i) {
            int complement = target - nums[i];
            if (seen.find(complement) != seen.end()) {
                return {seen[complement], i};
            }
            seen[nums[i]] = i;
        }
        return {};
    }
};
`,
  javascript: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 * Time Complexity: O(n)
 * Space Complexity: O(n)
 */
function solve(nums, target) {
  const seen = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (seen.has(complement)) {
      return [seen.get(complement), i];
    }
    seen.set(nums[i], i);
  }
  return [];
}
`,
  sql: `-- Problem: Find top 3 highest earning employees per department
-- Dialect: PostgreSQL / MySQL / Standard SQL

WITH RankedSalaries AS (
    SELECT 
        e.id,
        e.name AS employee_name,
        e.salary,
        d.name AS department_name,
        DENSE_RANK() OVER (
            PARTITION BY e.department_id 
            ORDER BY e.salary DESC
        ) AS rank_in_dept
    FROM employees e
    INNER JOIN departments d ON e.department_id = d.id
)
SELECT 
    department_name,
    employee_name,
    salary,
    rank_in_dept
FROM RankedSalaries
WHERE rank_in_dept <= 3
ORDER BY department_name ASC, salary DESC;
`,
};

export const DEFAULT_MOCK_SQL_SCHEMA = `-- Schema DDL & Mock Seed Rows
CREATE TABLE departments (
    id INT PRIMARY KEY,
    name VARCHAR(50) NOT NULL
);

CREATE TABLE employees (
    id INT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    salary DECIMAL(10, 2) NOT NULL,
    department_id INT REFERENCES departments(id)
);

INSERT INTO departments VALUES 
(1, 'Engineering'),
(2, 'Sales'),
(3, 'Marketing');

INSERT INTO employees VALUES 
(101, 'Alice', 120000, 1),
(102, 'Bob', 110000, 1),
(103, 'Charlie', 95000, 1),
(104, 'David', 90000, 1),
(105, 'Emma', 105000, 2),
(106, 'Frank', 98000, 2);
`;