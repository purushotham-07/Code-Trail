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

// Smart Pattern & Tag Auto-detection based on problem statement keywords
export function detectTopicAndTags(text = '', domain = 'dsa') {
  const content = String(text).toLowerCase();

  if (domain === 'sql') {
    if (
      content.includes('over (') ||
      content.includes('partition by') ||
      content.includes('rank()') ||
      content.includes('dense_rank') ||
      content.includes('lead(') ||
      content.includes('lag(') ||
      content.includes('window')
    ) {
      return { topic: 'Window Functions', tags: ['sql', 'window-functions', 'analytics'] };
    }
    if (content.includes('with recursive') || content.includes('cte') || content.includes('with ') || content.includes('common table expression')) {
      return { topic: 'CTEs & Recursive Queries', tags: ['sql', 'cte', 'recursion'] };
    }
    if (content.includes('join') || content.includes('inner join') || content.includes('left join') || content.includes('cross join') || content.includes('foreign key')) {
      return { topic: 'Multi-Table Joins', tags: ['sql', 'joins', 'relational'] };
    }
    if (content.includes('group by') || content.includes('having') || content.includes('count(') || content.includes('sum(') || content.includes('avg(') || content.includes('aggregate')) {
      return { topic: 'Aggregations & Grouping', tags: ['sql', 'aggregation', 'group-by'] };
    }
    if (content.includes('row_number') || content.includes('ntile') || content.includes('ranking') || content.includes('top nth')) {
      return { topic: 'Ranking & Partitioning', tags: ['sql', 'ranking', 'partition'] };
    }
    if (content.includes('date') || content.includes('interval') || content.includes('timestamp') || content.includes('datediff') || content.includes('now()')) {
      return { topic: 'Date & Time Manipulation', tags: ['sql', 'datetime'] };
    }
    return { topic: 'Window Functions', tags: ['sql', 'database'] };
  }

  // DSA Detection
  if (
    content.includes('two pointer') ||
    content.includes('2 pointer') ||
    content.includes('left and right pointer') ||
    (content.includes('sorted') && (content.includes('pair') || content.includes('triplet') || content.includes('palindrome') || content.includes('container with most water') || content.includes('3sum') || content.includes('two sum ii')))
  ) {
    return { topic: 'Two Pointers', tags: ['two-pointers', 'array', 'interview'] };
  }
  if (
    content.includes('sliding window') ||
    content.includes('window') ||
    (content.includes('subarray') && (content.includes('contiguous') || content.includes('longest substring') || content.includes('at most k') || content.includes('window size')))
  ) {
    return { topic: 'Sliding Window', tags: ['sliding-window', 'array', 'string'] };
  }
  if (
    content.includes('monotonic stack') ||
    content.includes('next greater') ||
    content.includes('previous smaller') ||
    content.includes('histogram') ||
    content.includes('daily temperatures') ||
    content.includes('bracket') ||
    content.includes('parentheses') ||
    content.includes('stack')
  ) {
    return { topic: 'Stack & Monotonic Stack', tags: ['stack', 'monotonic-stack', 'array'] };
  }
  if (
    content.includes('binary search') ||
    content.includes('bisect') ||
    content.includes('search in rotated') ||
    content.includes('search insert') ||
    (content.includes('sorted') && (content.includes('target') || content.includes('median of two sorted')))
  ) {
    return { topic: 'Binary Search', tags: ['binary-search', 'array', 'divide-and-conquer'] };
  }
  if (
    content.includes('dynamic programming') ||
    content.includes('knapsack') ||
    content.includes('subsequence') ||
    content.includes('memoization') ||
    content.includes('dp[') ||
    content.includes('min cost') ||
    content.includes('max profit') ||
    content.includes('climbing stairs') ||
    content.includes('coin change') ||
    content.includes('edit distance')
  ) {
    return { topic: 'Dynamic Programming', tags: ['dynamic-programming', 'memoization', 'algorithms'] };
  }
  if (
    content.includes('priority queue') ||
    content.includes('min heap') ||
    content.includes('max heap') ||
    content.includes('heap') ||
    content.includes('top k') ||
    content.includes('kth largest') ||
    content.includes('kth smallest') ||
    content.includes('median from data stream')
  ) {
    return { topic: 'Heap & Priority Queue', tags: ['heap', 'priority-queue', 'sorting'] };
  }
  if (
    content.includes('linked list') ||
    content.includes('listnode') ||
    content.includes('reverse linked list') ||
    content.includes('detect cycle') ||
    content.includes('fast and slow') ||
    content.includes('merge two sorted lists')
  ) {
    return { topic: 'Linked List', tags: ['linked-list', 'pointers'] };
  }
  if (
    content.includes('binary tree') ||
    content.includes('treenode') ||
    content.includes('bst') ||
    content.includes('inorder') ||
    content.includes('level order') ||
    content.includes('lowest common ancestor') ||
    content.includes('maximum depth') ||
    content.includes('invert binary tree')
  ) {
    return { topic: 'Trees & BST', tags: ['tree', 'binary-tree', 'dfs'] };
  }
  if (
    content.includes('graph') ||
    content.includes('bfs') ||
    content.includes('dfs') ||
    content.includes('shortest path') ||
    content.includes('dijkstra') ||
    content.includes('number of islands') ||
    content.includes('topological sort') ||
    content.includes('connected components')
  ) {
    return { topic: 'Graphs (BFS/DFS)', tags: ['graph', 'bfs', 'dfs'] };
  }
  if (
    content.includes('backtrack') ||
    content.includes('permutation') ||
    content.includes('subsets') ||
    content.includes('combination sum') ||
    content.includes('n-queens') ||
    content.includes('word search')
  ) {
    return { topic: 'Backtracking', tags: ['backtracking', 'recursion'] };
  }
  if (content.includes('trie') || content.includes('prefix tree') || content.includes('autocomplete')) {
    return { topic: 'Tries', tags: ['trie', 'string', 'tree'] };
  }
  if (content.includes('bit manipulation') || content.includes('xor') || content.includes('bitwise') || content.includes('single number') || content.includes('number of 1 bits')) {
    return { topic: 'Bit Manipulation', tags: ['bit-manipulation', 'math'] };
  }
  if (content.includes('hash map') || content.includes('hash table') || content.includes('frequency') || content.includes('anagram') || content.includes('two sum') || content.includes('contains duplicate')) {
    return { topic: 'Arrays & Hashing', tags: ['hash-table', 'array', 'string'] };
  }

  return { topic: 'Arrays & Hashing', tags: ['array', 'dsa'] };
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