// Canonical language definitions and taxonomies for DSA & SQL Platform

export const DSA_LANGUAGES = [
  { id: 'python', label: 'Python 3', ext: 'py', icon: '🐍', color: '#3572A5' },
  { id: 'java', label: 'Java', ext: 'java', icon: '☕', color: '#b07219' },
  { id: 'cpp', label: 'C++', ext: 'cpp', icon: '⚡', color: '#f34b7d' },
  { id: 'javascript', label: 'JavaScript', ext: 'js', icon: '🟨', color: '#f1e05a' },
];

export const SQL_LANGUAGES = [
  { id: 'sql', label: 'SQL', ext: 'sql', icon: '🗄️', color: '#e38c00' },
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

export const STARTER_BOILERPLATES = {
  python: `class Solution:
    def solve(self, nums: list[int], target: int) -> list[int]:
        """
        Time Complexity: O(n)
        Space Complexity: O(n)
        """
        # Write your algorithmic solution here
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
        // Write your algorithmic solution here
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
        // Write your algorithmic solution here
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
  // Write your algorithmic solution here
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