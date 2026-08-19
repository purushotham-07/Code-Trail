import mongoose from 'mongoose';
import Analysis from '../models/Analysis.js';

const aiCooldowns = new Map();
const AI_COOLDOWN_MS = 4 * 1000; // 4 second cooldown for fast responsive UX

const checkCooldown = (userId) => {
  const last = aiCooldowns.get(userId) || 0;
  const remaining = AI_COOLDOWN_MS - (Date.now() - last);
  return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
};

const markRequest = (userId) => {
  aiCooldowns.set(userId, Date.now());
};

const CANDIDATE_MODELS = [
  process.env.GROQ_MODEL,
  'openai/gpt-oss-120b',
  'groq/compound',
  'openai/gpt-oss-20b',
].filter(Boolean);

export const getComplexityRank = (complexityStr = '') => {
  const s = String(complexityStr).toLowerCase().replace(/\s+/g, '');
  if (!s || s === 'optimal') return 3;
  if (s.includes('o(1)')) return 1;
  if (s.includes('o(logn)') || s.includes('o(log(n))')) return 2;
  if (s.includes('o(n)') || s.includes('o(n+m)') || s.includes('o(v+e)')) return 3;
  if (s.includes('o(nlogn)') || s.includes('o(n*logn)') || s.includes('o(nlogk)')) return 4;
  if (s.includes('o(n^2)') || s.includes('o(n2)') || s.includes('o(n*m)')) return 5;
  if (s.includes('o(n^3)') || s.includes('o(n3)')) return 6;
  if (s.includes('o(2^n)') || s.includes('o(2n)')) return 7;
  if (s.includes('o(n!)')) return 8;
  return 4;
};

export const generatePatternHints = (topic = 'General', domain = 'dsa') => {
  const top = String(topic || 'General').trim();
  if (domain === 'sql') {
    return [
      `Hint 1 (Clause Execution): Determine whether row-level filtering (WHERE) or group-level aggregation (GROUP BY / HAVING / WINDOW) should execute first for ${top}.`,
      `Hint 2 (Query Architecture): Utilize CTEs (WITH clause) or Window Functions (OVER (PARTITION BY ... ORDER BY ...)) to avoid correlated subquery overhead.`,
      `Hint 3 (Optimization & Edge Cases): Account for NULL values in joins, tie-breaking in RANK() vs DENSE_RANK(), and index usage on foreign key columns.`,
    ];
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
};

/**
 * Deterministic static syntax & parser pre-check for DSA (Java, Python, C++, JS) & SQL.
 */
export const detectStaticSyntaxErrors = (code = '', language = 'python') => {
  const issues = [];
  if (!code || typeof code !== 'string') return issues;

  const lang = String(language || 'python').trim().toLowerCase();
  const rawLines = code.split('\n');

  // 1. Bracket & quote matching
  const stack = [];
  const pairs = { '}': '{', ')': '(', ']': '[' };
  const opening = new Set(['{', '(', '[']);
  const closing = new Set(['}', ')', ']']);

  rawLines.forEach((lineText, lineIdx) => {
    const lineNum = lineIdx + 1;
    const trimmed = lineText.trim();
    if (
      trimmed.startsWith('//') ||
      trimmed.startsWith('#') ||
      trimmed.startsWith('--') ||
      trimmed.startsWith('/*') ||
      trimmed.startsWith('*')
    ) {
      return;
    }

    let inString = false;
    let stringChar = '';

    for (let colIdx = 0; colIdx < lineText.length; colIdx += 1) {
      const ch = lineText[colIdx];
      const prev = colIdx > 0 ? lineText[colIdx - 1] : '';

      if ((ch === '"' || ch === "'" || ch === '`') && prev !== '\\') {
        if (!inString) {
          inString = true;
          stringChar = ch;
        } else if (stringChar === ch) {
          inString = false;
          stringChar = '';
        }
        continue;
      }

      if (!inString) {
        if (opening.has(ch)) {
          stack.push({ char: ch, line: lineNum, col: colIdx + 1 });
        } else if (closing.has(ch)) {
          if (stack.length === 0 || stack[stack.length - 1].char !== pairs[ch]) {
            issues.push({
              title: `Unmatched closing bracket '${ch}'`,
              severity: 'Critical',
              line: lineNum,
              column: colIdx + 1,
              description: `Found closing bracket '${ch}' with no matching opening bracket '${pairs[ch]}'.`,
              fix: `Remove extra '${ch}' or add matching '${pairs[ch]}'.`,
            });
          } else {
            stack.pop();
          }
        }
      }
    }
  });

  if (stack.length > 0) {
    const unclosed = stack.pop();
    issues.push({
      title: `Unclosed bracket '${unclosed.char}'`,
      severity: 'Critical',
      line: unclosed.line,
      column: unclosed.col,
      description: `Bracket '${unclosed.char}' opened on line ${unclosed.line} is never closed.`,
      fix: `Close the matching '${unclosed.char === '{' ? '}' : unclosed.char === '(' ? ')' : ']'}' before block end.`,
    });
  }

  // 2. Python syntax checks
  if (lang === 'python' || lang === 'py') {
    const blockHeaders = /^\s*(def\s+[a-zA-Z_][a-zA-Z0-9_]*\s*\(.*?\)|if\s+.*|elif\s+.*|else|for\s+.*|while\s+.*|class\s+[a-zA-Z_][a-zA-Z0-9_]*.*|try|except.*|finally|with\s+.*)\s*$/;
    rawLines.forEach((lineText, lineIdx) => {
      const lineNum = lineIdx + 1;
      const trimmed = lineText.trim();
      if (!trimmed || trimmed.startsWith('#')) return;

      // Missing colon in Python header
      if (blockHeaders.test(trimmed) && !trimmed.endsWith(':')) {
        issues.push({
          title: 'Missing colon (:) at end of header',
          severity: 'Critical',
          line: lineNum,
          column: lineText.length,
          description: `Statement "${trimmed}" must end with a colon (:).`,
          fix: `Add ':' at the end of line ${lineNum}.`,
        });
      }

      // else if instead of elif
      if (/^\s*else\s+if\b/.test(trimmed)) {
        issues.push({
          title: "Invalid keyword 'else if' in Python",
          severity: 'Critical',
          line: lineNum,
          column: lineText.indexOf('else if') + 1,
          description: "Python uses 'elif' instead of 'else if'.",
          fix: "Replace 'else if' with 'elif'.",
        });
      }

      // Logical operators && / || in Python
      if (/[^&]&&[^&]/.test(lineText) || /[^|]\|\|[^|]/.test(lineText)) {
        issues.push({
          title: "Invalid operator '&&' or '||' in Python",
          severity: 'Critical',
          line: lineNum,
          column: 1,
          description: "Python uses 'and' and 'or' keywords.",
          fix: "Replace '&&' with 'and', and '||' with 'or'.",
        });
      }

      // JS/C++ triple equals ===
      if (lineText.includes('===') || lineText.includes('!==')) {
        issues.push({
          title: "Invalid operator '===' or '!==' in Python",
          severity: 'Critical',
          line: lineNum,
          column: 1,
          description: "Python uses '==' for equality and '!=' for inequality.",
          fix: "Replace '===' with '==' and '!==' with '!='.",
        });
      }

      // ++ or -- in Python
      if (/\b[a-zA-Z_][a-zA-Z0-9_]*\+\+/.test(lineText) || /\+\+[a-zA-Z_][a-zA-Z0-9_]*/.test(lineText)) {
        issues.push({
          title: "Invalid operator '++' in Python",
          severity: 'Critical',
          line: lineNum,
          column: 1,
          description: "Python does not support '++'. Use '+=' instead.",
          fix: 'Replace var++ with var += 1.',
        });
      }

      // Lowercase booleans in Python
      if (/\b(true|false|null)\b/.test(lineText) && !lineText.includes('"') && !lineText.includes("'")) {
        const match = lineText.match(/\b(true|false|null)\b/);
        if (match) {
          const cap = match[1] === 'null' ? 'None' : match[1].charAt(0).toUpperCase() + match[1].slice(1);
          issues.push({
            title: `Incorrect literal '${match[1]}' in Python`,
            severity: 'Critical',
            line: lineNum,
            column: lineText.indexOf(match[1]) + 1,
            description: `Python booleans and null are capitalized: ${cap}.`,
            fix: `Replace '${match[1]}' with '${cap}'.`,
          });
        }
      }

      // Typos
      if (/\b(retun|retrun|reutrn)\b/.test(lineText)) {
        issues.push({
          title: "Misspelled keyword 'return'",
          severity: 'Critical',
          line: lineNum,
          column: 1,
          description: "Misspelled 'return' keyword.",
          fix: "Replace with 'return'.",
        });
      }
    });
  }

  // 3. Java / C++ / C Specific Rules
  if (['java', 'cpp', 'c', 'c++'].includes(lang)) {
    rawLines.forEach((lineText, lineIdx) => {
      const lineNum = lineIdx + 1;
      const trimmed = lineText.trim();
      if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*') || trimmed.startsWith('#')) {
        return;
      }

      // Semicolon check
      const isStatementCandidate =
        !trimmed.endsWith(';') &&
        !trimmed.endsWith('{') &&
        !trimmed.endsWith('}') &&
        !trimmed.endsWith(':') &&
        !trimmed.startsWith('if') &&
        !trimmed.startsWith('for') &&
        !trimmed.startsWith('while') &&
        !trimmed.startsWith('class') &&
        !trimmed.startsWith('public class') &&
        !trimmed.startsWith('interface') &&
        !trimmed.startsWith('else') &&
        !trimmed.startsWith('try') &&
        !trimmed.startsWith('catch') &&
        !trimmed.startsWith('finally') &&
        !trimmed.startsWith('switch') &&
        !trimmed.startsWith('case') &&
        !trimmed.startsWith('default:') &&
        !trimmed.startsWith('template') &&
        !trimmed.startsWith('#') &&
        !trimmed.endsWith('(') &&
        !trimmed.endsWith(',');

      if (isStatementCandidate && (trimmed.startsWith('return ') || trimmed.startsWith('int ') || trimmed.startsWith('long ') || trimmed.startsWith('double ') || trimmed.startsWith('bool ') || trimmed.startsWith('boolean ') || trimmed.startsWith('String ') || trimmed.startsWith('auto ') || trimmed.includes('='))) {
        issues.push({
          title: 'Missing semicolon (;) at end of statement',
          severity: 'Critical',
          line: lineNum,
          column: lineText.length,
          description: `Statement "${trimmed}" is missing a terminating semicolon (;).`,
          fix: `Add ';' at the end of line ${lineNum}.`,
        });
      }

      // Python keywords in Java/C++
      if (/\b(elif|def\s+|None|pass)\b/.test(lineText)) {
        issues.push({
          title: 'Python keyword detected in C++/Java',
          severity: 'Critical',
          line: lineNum,
          column: 1,
          description: 'Python syntax (def, elif, None, pass) is not valid in Java/C++.',
          fix: 'Use Java/C++ type declarations and if/else syntax.',
        });
      }

      // For loop check
      const forMatch = lineText.match(/for\s*\((.*?)\)/);
      if (forMatch && !lineText.includes(':')) {
        const header = forMatch[1];
        const semicolons = (header.match(/;/g) || []).length;
        if (semicolons < 2) {
          issues.push({
            title: 'Syntax error in for-loop header',
            severity: 'Critical',
            line: lineNum,
            column: lineText.indexOf('for') + 1,
            description: "3-part for loop requires semicolons: for (init; condition; increment).",
            fix: "Replace commas with semicolons in for-loop header.",
          });
        }
      }
    });
  }

  // 4. JavaScript Specific Rules
  if (['javascript', 'js', 'typescript', 'ts'].includes(lang)) {
    rawLines.forEach((lineText, lineIdx) => {
      const lineNum = lineIdx + 1;
      const trimmed = lineText.trim();
      if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*')) return;

      if (/\b(elif|def\s+|None|pass)\b/.test(lineText)) {
        issues.push({
          title: 'Python keyword in JavaScript',
          severity: 'Critical',
          line: lineNum,
          column: 1,
          description: "Python syntax ('def', 'elif', 'None') is not valid in JavaScript.",
          fix: "Use 'function', 'else if', and 'null/undefined'.",
        });
      }

      const forMatch = lineText.match(/for\s*\(\s*(?:let|var|const)\s+([^;)]+)\)/);
      if (forMatch && !lineText.includes(' of ') && !lineText.includes(' in ')) {
        const semicolons = (forMatch[0].match(/;/g) || []).length;
        if (semicolons < 2) {
          issues.push({
            title: 'Syntax error in for loop header',
            severity: 'Critical',
            line: lineNum,
            column: lineText.indexOf('for') + 1,
            description: '3-part for loop requires semicolons: for (init; cond; update).',
            fix: 'Add the missing semicolon between condition and increment.',
          });
        }
      }
    });
  }

  // 5. SQL Specific Rules
  if (lang === 'sql') {
    rawLines.forEach((lineText, lineIdx) => {
      const lineNum = lineIdx + 1;
      const trimmed = lineText.trim();
      if (!trimmed || trimmed.startsWith('--') || trimmed.startsWith('/*')) return;

      if (/\bWHER\b/i.test(lineText)) {
        issues.push({
          title: "SQL keyword typo 'WHER'",
          severity: 'Critical',
          line: lineNum,
          column: lineText.search(/\bWHER\b/i) + 1,
          description: "Keyword 'WHER' is misspelled.",
          fix: "Replace 'WHER' with 'WHERE'.",
        });
      }
      if (/\bSELETC\b/i.test(lineText) || /\bSELET\b/i.test(lineText)) {
        issues.push({
          title: "SQL keyword typo in 'SELECT'",
          severity: 'Critical',
          line: lineNum,
          column: 1,
          description: "Keyword 'SELECT' is misspelled.",
          fix: "Replace with 'SELECT'.",
        });
      }
      if (/\bINER\s+JOIN\b/i.test(lineText)) {
        issues.push({
          title: "SQL keyword typo 'INER JOIN'",
          severity: 'Critical',
          line: lineNum,
          column: lineText.search(/\bINER\s+JOIN\b/i) + 1,
          description: "Keyword 'INER JOIN' is misspelled.",
          fix: "Replace 'INER JOIN' with 'INNER JOIN'.",
        });
      }
      if (/,\s*FROM\b/i.test(lineText)) {
        issues.push({
          title: 'Trailing comma before FROM clause',
          severity: 'Critical',
          line: lineNum,
          column: lineText.search(/,\s*FROM\b/i) + 1,
          description: "SQL syntax error: unexpected comma immediately before 'FROM'.",
          fix: "Remove the trailing comma before 'FROM'.",
        });
      }
    });
  }

  return issues;
};

const extractGroqJson = (text) => {
  if (!text) return null;
  try {
    let clean = String(text).trim();
    if (clean.includes('```')) {
      const match = clean.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (match && match[1]) {
        clean = match[1].trim();
      }
    }
    const firstBrace = clean.indexOf('{');
    const lastBrace = clean.lastIndexOf('}');
    if (firstBrace >= 0 && lastBrace >= 0 && lastBrace > firstBrace) {
      return JSON.parse(clean.slice(firstBrace, lastBrace + 1));
    }
    return JSON.parse(clean);
  } catch (_error) {
    return null;
  }
};

async function callGroqAPI(messages) {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not configured');
  }

  let lastError = null;
  for (const modelName of CANDIDATE_MODELS) {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: modelName,
          messages,
          temperature: 0.1,
          max_tokens: 500, // Lean and fast
          top_p: 0.8,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        console.warn(`Groq model ${modelName} returned ${response.status}: ${text.slice(0, 150)}`);
        lastError = new Error(`Groq ${modelName} status ${response.status}`);
        continue;
      }

      const payload = await response.json();
      const text = payload?.choices?.[0]?.message?.content || '';
      const parsed = extractGroqJson(text);
      if (parsed) {
        return { parsed, modelName };
      }
    } catch (err) {
      lastError = err;
      console.warn(`Groq request to ${modelName} failed:`, err.message);
    }
  }

  throw lastError || new Error('All candidate Groq models failed');
}

/**
 * Super-compact prompt for DSA: only time/space complexity, syntax check, approach review & 3 progressive hints.
 */
const promptForDSA = (code, language, targetTime, targetSpace, problemStatement) => `
Analyze this ${language} code for the problem: "${problemStatement || 'Algorithmic Problem'}".
Target Time: ${targetTime || 'Optimal'}, Target Space: ${targetSpace || 'Optimal'}.

Tasks:
1. Check for real syntax/compilation bugs (e.g. mismatched braces, missing return, invalid operators, bad loops).
   CRITICAL PLATFORM RULE: DO NOT flag missing imports, missing packages, or missing #include headers (e.g. java.util.*, Map, List, Queue, Stack, vector, string, heapq, collections, etc.) as errors. All standard libraries and collections are globally available in this coding platform environment.
   If real syntax errors exist, set "hasSyntaxErrors": true and list in "syntaxErrors" [{ "title": "...", "line": 1, "description": "...", "fix": "..." }]. Otherwise set "hasSyntaxErrors": false and "syntaxErrors": [].
2. Evaluate actual "timeComplexity" (e.g. "O(n^2)") and "spaceComplexity" (e.g. "O(1)") of this current code.
3. State "currentApproach": 1-2 sentences explaining what approach the current code followed.
4. State "recommendedApproach": 1-2 sentences explaining what approach should be followed to achieve the target complexity (${targetTime || 'Optimal'} time, ${targetSpace || 'Optimal'} space).
5. Set "targetComplexityMet": true/false (true if current time & space complexity meets/beats the target without syntax errors).
6. Provide 3 progressive "hints" tailored to the problem statement:
   - Hint 1: High-level intuition
   - Hint 2: Optimal data structure
   - Hint 3: Key transitions & edge cases

Return ONLY valid JSON (no markdown fences):
{
  "hasSyntaxErrors": false,
  "syntaxErrors": [],
  "timeComplexity": "O(...)",
  "spaceComplexity": "O(...)",
  "currentApproach": "...",
  "recommendedApproach": "...",
  "targetComplexityMet": true,
  "hints": [
    "Hint 1: ...",
    "Hint 2: ...",
    "Hint 3: ..."
  ]
}

Code (${language}):
${code}
`;

/**
 * Super-compact prompt for SQL: only time/space complexity, syntax check, approach review & 3 progressive hints.
 */
const promptForSQL = (code, dialect, sqlSchema, problemStatement) => `
Analyze this ${dialect || 'SQL'} query for the problem: "${problemStatement || 'SQL Data Query'}".
Schema: ${sqlSchema || 'Standard tables'}

Tasks:
1. Check for SQL syntax errors. Set "hasSyntaxErrors": true/false. List in "syntaxErrors" [{ "title": "...", "line": 1, "description": "...", "fix": "..." }].
2. Evaluate "timeComplexity" (e.g. "O(N log N) / Index Scan") and "spaceComplexity" (e.g. "O(1) / O(N) Temp Table").
3. State "currentApproach": 1-2 sentences on what query approach was used.
4. State "recommendedApproach": 1-2 sentences on what optimal query / indexing strategy achieves target performance.
5. Set "targetComplexityMet": true/false.
6. Provide 3 progressive "hints" tailored to the problem statement.

Return ONLY valid JSON (no markdown fences):
{
  "hasSyntaxErrors": false,
  "syntaxErrors": [],
  "timeComplexity": "O(...)",
  "spaceComplexity": "O(...)",
  "currentApproach": "...",
  "recommendedApproach": "...",
  "targetComplexityMet": true,
  "hints": [
    "Hint 1: ...",
    "Hint 2: ...",
    "Hint 3: ..."
  ]
}

SQL:
${code}
`;

const extractErrorLinesFromIssues = (issues = []) => {
  if (!Array.isArray(issues)) return [];
  const lineNumbers = new Set();
  issues.forEach((issue) => {
    const num = Number(issue?.line);
    if (Number.isFinite(num) && num > 0) lineNumbers.add(num);
  });
  return Array.from(lineNumbers).sort((a, b) => a - b);
};

export const analyzeSnippetCode = async (req, res) => {
  try {
    const {
      code = '',
      language = 'python',
      snippetId,
      versionNumber,
      domain = 'dsa',
      topic = 'General',
      problemStatement = '',
      targetTimeComplexity = '',
      targetSpaceComplexity = '',
      sqlSchema = '',
      sqlDialect = 'standard',
      forceRefresh = false,
    } = req.body || {};
    const normalizedCode = String(code || '').trim();

    if (!normalizedCode) {
      return res.status(400).json({ message: 'Code is required for analysis.' });
    }

    if (!req.user?.id) {
      return res.status(401).json({ message: 'Please sign in to run AI analysis.' });
    }

    const normalizedVersion = Number(versionNumber || 1);
    const activeSnippetId = snippetId;

    // Check cooldown
    const cooldownRemaining = checkCooldown(req.user.id);
    if (cooldownRemaining > 0) {
      return res.status(429).json({
        message: `Please wait ${cooldownRemaining}s before requesting analysis again.`,
      });
    }

    // Check cache
    if (!forceRefresh && activeSnippetId && mongoose.connection?.readyState === 1) {
      const cached = await Analysis.findOne({
        snippetId: activeSnippetId,
        versionNumber: normalizedVersion,
      }).lean();

      if (cached && cached.source === 'groq') {
        markRequest(req.user.id);
        return res.json({
          ...cached,
          fromCache: true,
          groqEnabled: true,
          groqError: '',
          hasSyntaxErrors: Boolean(cached.hasSyntaxErrors),
          errorLines: cached.errorLines || [],
          issues: cached.issues || [],
          timeComplexity: cached.timeComplexity || '',
          spaceComplexity: cached.spaceComplexity || '',
          currentApproach: cached.currentApproach || cached.explanation || '',
          recommendedApproach: cached.recommendedApproach || '',
          targetComplexityMet: Boolean(cached.targetComplexityMet),
          isSolved: Boolean(cached.targetComplexityMet) && !cached.hasSyntaxErrors,
          hints: (cached.hints?.length > 0) ? cached.hints : generatePatternHints(topic, domain),
        });
      }
    }

    // Deterministic static syntax pre-check
    const staticIssues = detectStaticSyntaxErrors(normalizedCode, language);

    if (!process.env.GROQ_API_KEY) {
      markRequest(req.user.id);
      const fallbackHints = generatePatternHints(topic, domain);
      return res.json({
        source: 'local',
        hasSyntaxErrors: staticIssues.length > 0,
        errorLines: staticIssues.map((i) => i.line).filter(Boolean),
        issues: staticIssues,
        timeComplexity: 'N/A',
        spaceComplexity: 'N/A',
        currentApproach: 'Static review of code structure completed.',
        recommendedApproach: `Follow optimal ${topic} pattern to achieve ${targetTimeComplexity || 'O(n)'}.`,
        targetComplexityMet: staticIssues.length === 0,
        isSolved: staticIssues.length === 0,
        hints: fallbackHints,
        groqEnabled: false,
      });
    }

    markRequest(req.user.id);

    const isSql = domain === 'sql' || language === 'sql';
    const systemPrompt = isSql
      ? 'You are a strict SQL query optimization engine. Output strictly valid JSON without markdown fences.'
      : 'You are a strict algorithmic compiler and DSA mentor. Output strictly valid JSON without markdown fences.';

    const userPrompt = isSql
      ? promptForSQL(normalizedCode, sqlDialect, sqlSchema, problemStatement)
      : promptForDSA(normalizedCode, language, targetTimeComplexity, targetSpaceComplexity, problemStatement);

    const { parsed } = await callGroqAPI([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ]);

    const rawIssues = Array.isArray(parsed.syntaxErrors) ? parsed.syntaxErrors : Array.isArray(parsed.issues) ? parsed.issues : [];
    const combinedIssuesMap = new Map();
    staticIssues.forEach((iss) => {
      combinedIssuesMap.set(`${iss.line}-${iss.title}`, iss);
    });
    rawIssues.forEach((iss) => {
      const line = Number.isFinite(Number(iss.line)) && Number(iss.line) > 0 ? Number(iss.line) : null;
      const formatted = {
        title: iss.title || 'Syntax Issue',
        severity: 'Critical',
        line,
        description: iss.description || '',
        fix: iss.fix || '',
      };
      combinedIssuesMap.set(`${line}-${formatted.title}`, formatted);
    });

    const isImportOrLibraryError = (issue) => {
      const text = `${issue?.title || ''} ${issue?.description || ''} ${issue?.fix || ''}`.toLowerCase();
      return (
        text.includes('import') ||
        text.includes('#include') ||
        text.includes('header file') ||
        text.includes('missing package') ||
        (text.includes('cannot find symbol') && (text.includes('map') || text.includes('list') || text.includes('vector') || text.includes('queue') || text.includes('set') || text.includes('stack') || text.includes('deque') || text.includes('heapq'))) ||
        text.includes('not imported') ||
        (text.includes('undeclared identifier') && (text.includes('vector') || text.includes('string') || text.includes('pair') || text.includes('map') || text.includes('set') || text.includes('unordered_map') || text.includes('queue') || text.includes('stack')))
      );
    };

    const formattedIssues = Array.from(combinedIssuesMap.values()).filter((issue) => !isImportOrLibraryError(issue));
    const hasSyntaxErrors = formattedIssues.length > 0;
    const errorLineNumbers = extractErrorLinesFromIssues(formattedIssues);

    const actualTime = parsed.timeComplexity || '';
    const actualTimeRank = getComplexityRank(actualTime);
    const targetTimeRank = targetTimeComplexity ? getComplexityRank(targetTimeComplexity) : 4;
    const isTargetMet = parsed.targetComplexityMet !== undefined && parsed.targetComplexityMet !== null
      ? Boolean(parsed.targetComplexityMet)
      : actualTimeRank <= targetTimeRank && !hasSyntaxErrors;

    const result = {
      source: 'groq',
      groqEnabled: true,
      hasSyntaxErrors,
      errorLines: errorLineNumbers,
      issues: formattedIssues,
      timeComplexity: parsed.timeComplexity || 'O(n)',
      spaceComplexity: parsed.spaceComplexity || 'O(1)',
      currentApproach: parsed.currentApproach || 'Evaluated current algorithm implementation.',
      recommendedApproach: parsed.recommendedApproach || `Implement ${topic} to achieve ${targetTimeComplexity || 'optimal complexity'}.`,
      targetComplexityMet: isTargetMet,
      isSolved: isTargetMet && !hasSyntaxErrors,
      hints: (Array.isArray(parsed.hints) && parsed.hints.length > 0)
        ? parsed.hints
        : generatePatternHints(topic, domain),
    };

    if (activeSnippetId && mongoose.connection?.readyState === 1) {
      await Analysis.findOneAndUpdate(
        {
          snippetId: activeSnippetId,
          versionNumber: normalizedVersion,
        },
        {
          $set: {
            domain,
            hasSyntaxErrors: result.hasSyntaxErrors,
            errorLines: result.errorLines,
            issues: result.issues,
            timeComplexity: result.timeComplexity,
            spaceComplexity: result.spaceComplexity,
            currentApproach: result.currentApproach,
            recommendedApproach: result.recommendedApproach,
            targetComplexityMet: result.targetComplexityMet,
            hints: result.hints,
            source: result.source,
            groqEnabled: true,
          },
        },
        { upsert: true, new: true }
      );
    }

    return res.json(result);
  } catch (error) {
    console.error('Analysis error:', error.message);
    const fallbackHints = generatePatternHints(req.body?.topic, req.body?.domain);
    return res.json({
      source: 'local',
      hasSyntaxErrors: false,
      errorLines: [],
      issues: [],
      timeComplexity: req.body?.targetTimeComplexity || 'O(n)',
      spaceComplexity: req.body?.targetSpaceComplexity || 'O(1)',
      currentApproach: 'Review of current code structure completed.',
      recommendedApproach: `Follow standard ${req.body?.topic || 'DSA'} pattern.`,
      targetComplexityMet: true,
      isSolved: true,
      hints: fallbackHints,
      groqEnabled: true,
    });
  }
};
