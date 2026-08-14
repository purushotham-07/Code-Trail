import Analysis from '../models/Analysis.js';

const aiCooldowns = new Map();
const AI_COOLDOWN_MS = 10 * 1000;

const checkCooldown = (userId) => {
  const last = aiCooldowns.get(userId) || 0;
  const remaining = AI_COOLDOWN_MS - (Date.now() - last);
  return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
};

const markRequest = (userId) => {
  aiCooldowns.set(userId, Date.now());
};

const FALLBACK_LIBRARY = {
  binarySearch: {
    algorithm: 'Binary Search',
    approach: 'Optimal (Divide & Conquer / Two Pointers)',
    timeComplexity: 'O(log n)',
    spaceComplexity: 'O(1)',
    overallScore: 9,
    ratings: {
      performance: 9,
      readability: 9,
      maintainability: 8,
      security: 9,
      scalability: 9,
    },
    explanation: 'The code repeatedly halves the search interval, achieving logarithmic time complexity with constant auxiliary space.',
    summary: 'Clean implementation of binary search with efficient logarithmic lookup.',
    issues: [],
    strengths: [
      'Logarithmic time complexity minimizes search iterations on sorted inputs.',
      'In-place search with O(1) extra memory overhead.',
    ],
    suggestions: [
      'Use mid = left + Math.floor((right - left) / 2) to prevent potential integer overflow in large array bounds.',
      'Add input validation to handle null or empty arrays gracefully.',
    ],
    securityIssues: [],
    performanceImprovements: [
      'Ensure input is sorted prior to invocation, or document precondition in function JSDoc/types.',
    ],
    futureSuggestions: [
      'Consider generalizing to a lower_bound / upper_bound binary search helper for range queries.',
    ],
    designPatterns: ['Binary Search Pattern', 'Two Pointers'],
    interviewQuestions: [
      'How would you find the first or last occurrence of a duplicate element using binary search?',
      'How does binary search behave on rotated sorted arrays?',
    ],
    category: 'DSA',
    subCategory: 'Searching Algorithms',
    isDSA: true,
  },
  mergeSort: {
    algorithm: 'Merge Sort',
    approach: 'Optimal (Divide & Conquer)',
    timeComplexity: 'O(n log n)',
    spaceComplexity: 'O(n)',
    overallScore: 8,
    ratings: {
      performance: 8,
      readability: 8,
      maintainability: 8,
      security: 9,
      scalability: 8,
    },
    explanation: 'Divide and conquer sorting algorithm that recursively halves the array and merges sorted subarrays in linear time.',
    summary: 'Stable O(n log n) sorting algorithm with guaranteed performance bounds.',
    issues: [],
    strengths: [
      'Guaranteed O(n log n) worst-case time complexity.',
      'Stable sorting preserves the relative order of equal elements.',
    ],
    suggestions: [
      'For small subarray partitions (length <= 15), switch to Insertion Sort to reduce recursive call overhead.',
      'Pre-allocate auxiliary buffer arrays to reduce garbage collection churn.',
    ],
    securityIssues: [],
    performanceImprovements: [
      'Reuse a single temporary buffer across recursive merge calls to reduce memory allocations.',
    ],
    futureSuggestions: [
      'Implement an iterative (bottom-up) variant to eliminate call-stack recursion overhead.',
    ],
    designPatterns: ['Divide and Conquer'],
    interviewQuestions: [
      'Why is Merge Sort preferred over QuickSort for sorting linked lists?',
      'How can Merge Sort be parallelized for multi-core processors?',
    ],
    category: 'DSA',
    subCategory: 'Sorting Algorithms',
    isDSA: true,
  },
  bfs: {
    algorithm: 'Breadth-First Search (BFS)',
    approach: 'Optimal (Queue-based Level Order Traversal)',
    timeComplexity: 'O(V + E)',
    spaceComplexity: 'O(V)',
    overallScore: 8,
    ratings: {
      performance: 8,
      readability: 9,
      maintainability: 8,
      security: 9,
      scalability: 8,
    },
    explanation: 'Traverses graph or tree level by level using a queue, guaranteeing the shortest path in unweighted graphs.',
    summary: 'Level-order graph exploration ensuring shortest path discovery in unweighted graphs.',
    issues: [],
    strengths: [
      'Finds shortest path in unweighted graphs efficiently.',
      'Iterative queue structure prevents stack overflow.',
    ],
    suggestions: [
      'Ensure a visited set/array is maintained to prevent infinite cycles in cyclic graphs.',
      'Add early exit as soon as the target destination node is dequeued.',
    ],
    securityIssues: [],
    performanceImprovements: [
      'Use a double-ended queue or circular array pointer instead of Array.shift() to avoid O(N) dequeue overhead.',
    ],
    futureSuggestions: [
      'Support bidirectional BFS for larger graph search spaces.',
    ],
    designPatterns: ['Queue-based Traversal'],
    interviewQuestions: [
      'How does 0-1 BFS work for graphs with edge weights of only 0 and 1?',
      'When is BFS preferred over DFS for finding connectivity?',
    ],
    category: 'DSA',
    subCategory: 'Graph Algorithms',
    isDSA: true,
  },
  dfs: {
    algorithm: 'Depth-First Search (DFS)',
    approach: 'Optimal (Recursive / Stack Traversal)',
    timeComplexity: 'O(V + E)',
    spaceComplexity: 'O(V)',
    overallScore: 8,
    ratings: {
      performance: 8,
      readability: 9,
      maintainability: 8,
      security: 9,
      scalability: 8,
    },
    explanation: 'Explores deepest nodes along each branch before backtracking, utilizing recursion or an explicit stack.',
    summary: 'Deep branch-first traversal ideal for connectivity, topological sorting, and cycle detection.',
    issues: [],
    strengths: [
      'Simple, elegant recursive implementation.',
      'Easily tracks path history and ancestor states during backtracking.',
    ],
    suggestions: [
      'Use an explicit iterative stack if graph depth can exceed runtime recursion limits.',
      'Track visited state per node to avoid cyclic loops.',
    ],
    securityIssues: [],
    performanceImprovements: [
      'Use typed arrays or bitsets for visited flags when vertex count is fixed and dense.',
    ],
    futureSuggestions: [
      'Implement Tarjan or Kosaraju algorithm for strongly connected components if needed.',
    ],
    designPatterns: ['Recursive Backtracking', 'Graph Traversal'],
    interviewQuestions: [
      'How do you detect cycles in directed vs undirected graphs using DFS?',
      'How does topological sort leverage DFS post-order finishing times?',
    ],
    category: 'DSA',
    subCategory: 'Graph Algorithms',
    isDSA: true,
  },
  bubbleSort: {
    algorithm: 'Bubble Sort',
    approach: 'Brute Force (Adjacent Comparison)',
    timeComplexity: 'O(n^2)',
    spaceComplexity: 'O(1)',
    overallScore: 5,
    ratings: {
      performance: 3,
      readability: 7,
      maintainability: 6,
      security: 8,
      scalability: 3,
    },
    explanation: 'Repeatedly steps through the list, compares adjacent elements and swaps them if they are in the wrong order.',
    summary: 'Simple comparison sort with quadratic time complexity; not recommended for production datasets.',
    issues: [
      {
        title: 'Suboptimal quadratic time complexity',
        severity: 'Medium',
        line: 1,
        column: 1,
        description: 'Nested loops result in O(n^2) runtime which degrades severely on large inputs.',
        fix: 'Replace with QuickSort, MergeSort, or native sort method (e.g. Array.prototype.sort / std::sort).',
      },
    ],
    strengths: ['Simple to understand and teach.', 'In-place sorting with O(1) auxiliary space.'],
    suggestions: [
      'Add a boolean swapped flag to exit early if no swaps occurred in a pass (improves best-case to O(n)).',
      'Replace bubble sort with Merge Sort or QuickSort for performance-sensitive code.',
    ],
    securityIssues: [],
    performanceImprovements: [
      'Upgrade algorithm from O(n^2) to O(n log n) sorting.',
    ],
    futureSuggestions: [],
    designPatterns: [],
    interviewQuestions: [
      'What is the best, average, and worst-case time complexity of optimized Bubble Sort?',
      'Why is Bubble Sort considered stable?',
    ],
    category: 'DSA',
    subCategory: 'Sorting Algorithms',
    isDSA: true,
  },
  dynamicProgramming: {
    algorithm: 'Dynamic Programming',
    approach: 'Optimal (Memoization / Tabulation)',
    timeComplexity: 'O(n * m)',
    spaceComplexity: 'O(n * m)',
    overallScore: 8,
    ratings: {
      performance: 8,
      readability: 8,
      maintainability: 8,
      security: 9,
      scalability: 8,
    },
    explanation: 'Solves complex problems by breaking them down into simpler subproblems and storing intermediate results.',
    summary: 'Subproblem caching avoiding duplicate calculations across overlapping states.',
    issues: [],
    strengths: [
      'Eliminates exponential branching by caching overlapping subproblem results.',
      'Optimal substructure guarantees global optimality.',
    ],
    suggestions: [
      'Optimize space complexity from O(n * m) to O(min(n, m)) by maintaining only the previous state row/column.',
      'Check base cases and boundary constraints to prevent out-of-bounds array access.',
    ],
    securityIssues: [],
    performanceImprovements: [
      'Space-compress DP table if current transition only references the previous row.',
    ],
    futureSuggestions: [
      'Consider bitmask DP or segment tree optimization if state space expands.',
    ],
    designPatterns: ['Dynamic Programming', 'Memoization'],
    interviewQuestions: [
      'What are the key differences between Top-Down (Memoization) and Bottom-Up (Tabulation)?',
      'How do you identify if a problem satisfies optimal substructure and overlapping subproblems?',
    ],
    category: 'DSA',
    subCategory: 'Dynamic Programming',
    isDSA: true,
  },
};

const normalize = (value = '') => String(value).toLowerCase();

const detectAlgorithm = (code = '') => {
  const text = normalize(code);

  if (/(binary search|mid.*left|right.*mid|while.*left.*right|low.*high)/.test(text)) {
    return 'binarySearch';
  }

  if (/(merge sort|merge\(|left.*mid.*right)/.test(text)) {
    return 'mergeSort';
  }

  if (/(queue|deque|breadth|bfs)/.test(text)) {
    return 'bfs';
  }

  if (/(stack|dfs|depth|visited\[.*\]|recurs)/.test(text)) {
    return 'dfs';
  }

  if (/(dp\[|dynami(c|cs)|memo|lru)/.test(text)) {
    return 'dynamicProgramming';
  }

  if (/(bubble sort|swap.*arr\[j|arr\[j\+1\]|j \+ 1)/.test(text)) {
    return 'bubbleSort';
  }

  return null;
};

const buildFallbackAnalysis = (code = '', language = 'javascript') => {
  const key = detectAlgorithm(code);
  const match = FALLBACK_LIBRARY[key] || {
    algorithm: 'General Code Review',
    approach: 'Standard Implementation',
    timeComplexity: 'N/A',
    spaceComplexity: 'N/A',
    overallScore: 7,
    ratings: {
      performance: 7,
      readability: 8,
      maintainability: 7,
      security: 8,
      scalability: 7,
    },
    explanation: 'Code structure reviewed for syntax, clarity, error handling, and performance considerations.',
    summary: 'Standard implementation reviewed against general software design and clean code principles.',
    issues: [],
    strengths: [
      'Readable logic flow and straightforward structure.',
    ],
    suggestions: [
      'Add meaningful variable and function names to improve self-documenting readability.',
      'Include robust error handling for unexpected inputs and null/undefined edge cases.',
      'Add inline comments or documentation explaining non-obvious business logic.',
    ],
    securityIssues: [],
    performanceImprovements: [
      'Validate input parameters early to prevent unhandled runtime exceptions.',
    ],
    futureSuggestions: [
      'Add unit tests covering edge cases, boundary inputs, and error states.',
    ],
    designPatterns: [],
    interviewQuestions: [],
    learningResources: [],
    category: 'General',
    subCategory: 'Code Review',
    isDSA: false,
  };

  return {
    source: 'fallback',
    language,
    algorithm: match.algorithm,
    approach: match.approach,
    timeComplexity: match.timeComplexity,
    spaceComplexity: match.spaceComplexity,
    overallScore: match.overallScore,
    ratings: match.ratings,
    explanation: match.explanation,
    summary: match.summary,
    issues: match.issues || [],
    analysisErrors: (match.issues || []).map((i) => `${i.title} (Line ${i.line})`),
    strengths: match.strengths || [],
    suggestions: match.suggestions || [],
    securityIssues: match.securityIssues || [],
    performanceImprovements: match.performanceImprovements || [],
    futureSuggestions: match.futureSuggestions || [],
    designPatterns: match.designPatterns || [],
    interviewQuestions: match.interviewQuestions || [],
    learningResources: match.learningResources || [],
    category: match.category,
    subCategory: match.subCategory,
    isDSA: match.isDSA,
    hasSyntaxErrors: false,
    errorLines: [],
    correctedCode: '',
    optimizedCode: '',
    dataStructureRecommendations: '',
  };
};

const extractGroqJson = (text) => {
  if (!text) return null;
  try {
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace >= 0 && lastBrace >= 0 && lastBrace > firstBrace) {
      return JSON.parse(text.slice(firstBrace, lastBrace + 1));
    }
    return JSON.parse(text);
  } catch (_error) {
    return null;
  }
};

/*
 * Standard code analysis prompt — engineered for high precision code reviews.
 */
const promptForGroq = (code, language) => `
You are a Staff Software Engineer, Lead Code Reviewer, Security Auditor, and Competitive Programming Specialist.

Perform a thorough, expert-level review of the provided ${language} code.

STRICT OUTPUT RULES:
- Return ONLY a single valid JSON object.
- Absolutely NO markdown wrapping (no \`\`\`json or \`\`\`).
- No commentary or text outside the JSON object.
- Never invent issues; if the code is solid, return empty arrays.
- Accurately identify 1-based line numbers for all issues.

EVALUATION CRITERIA:
1. CATEGORY: DSA | Frontend | Backend | Full Stack | Security | DevOps | Other
2. CORRECTNESS & ISSUES:
   Check for syntax errors, off-by-one errors, unhandled null/undefined, memory leaks, security holes (XSS, injection, prototype pollution), and performance bottlenecks.
   Every issue MUST have:
   - title (concise summary)
   - severity ("Low" | "Medium" | "High" | "Critical")
   - line (1-based integer line number or null if global)
   - column (1-based integer or null)
   - description (clear explanation of why this is an issue)
   - fix (exact actionable fix)
3. RATINGS (Scale of 1 to 10 integers):
   - overallScore
   - ratings: { performance, readability, maintainability, security, scalability }
4. DSA & ALGORITHMIC ANALYSIS (if applicable):
   - algorithm: exact name
   - approach: "Brute Force" | "Better" | "Optimal"
   - timeComplexity: Big-O notation (e.g., "O(N log N)")
   - spaceComplexity: Big-O notation (e.g., "O(1)")
   - dataStructureRecommendations: recommend specific data structures (e.g. HashMap, Min-Heap, Monotonic Deque, Trie) and justify why.
5. CODE GENERATION:
   - correctedCode: If the code has syntax/runtime bugs, provide the complete corrected code. Otherwise "".
   - optimizedCode: If the code can be optimized with better time/space complexity or cleaner architecture, provide the complete optimized code. If already optimal, return "".
6. INTERVIEW & LEARNING:
   - strengths: 2-4 positive patterns observed
   - suggestions: 2-4 concrete refactoring/improvement suggestions
   - securityIssues: specific security points
   - performanceImprovements: specific performance points
   - interviewQuestions: 2-3 technical interview questions based on this code
   - summary: 2-3 sentence executive summary

EXPECTED JSON SCHEMA:
{
  "category": "string",
  "subCategory": "string",
  "isDSA": false,
  "hasSyntaxErrors": false,
  "overallScore": 8,
  "ratings": {
    "performance": 8,
    "readability": 8,
    "maintainability": 8,
    "security": 8,
    "scalability": 8
  },
  "algorithm": "",
  "approach": "",
  "timeComplexity": "",
  "spaceComplexity": "",
  "dataStructureRecommendations": "",
  "explanation": "High-level summary of what the code does and how it works.",
  "summary": "Concise 2-sentence summary of the code review findings.",
  "issues": [
    {
      "title": "Short title",
      "severity": "Low | Medium | High | Critical",
      "line": 1,
      "column": 1,
      "description": "Explanation",
      "fix": "Actionable solution"
    }
  ],
  "strengths": ["...", "..."],
  "suggestions": ["...", "..."],
  "securityIssues": ["..."],
  "performanceImprovements": ["..."],
  "futureSuggestions": ["..."],
  "designPatterns": ["..."],
  "correctedCode": "",
  "optimizedCode": "",
  "interviewQuestions": ["..."],
  "learningResources": ["..."]
}

Language: ${language}

Source Code:
${code}
`;

/*
 * Coding Platform Mentor Prompt — engineered for hint-based DSA coaching.
 */
const promptForCodingPlatform = (code, language, problemStatement) => `
You are a senior algorithmic interview coach and competitive programming mentor.

The candidate has submitted their code alongside the problem statement below.
Your role is to evaluate their approach and provide progressive hints WITHOUT giving away the full solution code.

STRICT OUTPUT RULES:
- Return ONLY a single valid JSON object.
- NO markdown formatting (no \`\`\`json or \`\`\`).
- No prose outside JSON.

MENTORING GUIDELINES:
1. Determine if the candidate's approach is optimal for the problem constraints.
2. Provide 3 progressive hints:
   - Tier 1 (Intuition / High Level): Guides thinking on what pattern or property to observe.
   - Tier 2 (Data Structure & Complexity): Suggests the ideal data structures (e.g. Monotonic Stack, Two Pointers, Fenwick Tree, Union-Find) and explains why they meet the problem constraints.
   - Tier 3 (Algorithm & Edge Cases): Outlines key transitions and edge cases to watch out for.
3. Highlight Common Mistakes that interview candidates frequently make on this problem.

PROBLEM STATEMENT:
${problemStatement}

CANDIDATE'S CODE (${language}):
${code}

EXPECTED JSON SCHEMA:
{
  "isOptimal": false,
  "approachExplanation": "Clear, encouraging explanation of the candidate's current approach, its time/space complexity, and whether it meets the problem constraints.",
  "recommendedDataStructures": [
    "HashMap — achieves O(1) lookups to eliminate quadratic scanning",
    "Min-Heap — maintains the top K elements in O(log K) per insertion"
  ],
  "hints": [
    "Hint 1 (Intuition): Think about whether you need to re-examine all previous elements or only the most recent ones.",
    "Hint 2 (Data Structure): What data structure allows O(1) amortized queries for this property?",
    "Hint 3 (Edge Cases): Make sure to test empty inputs, single element arrays, and duplicate values."
  ],
  "commonMistakes": [
    "Forgetting to handle duplicate keys in the frequency map.",
    "Using recursion which causes stack overflow on deep inputs (N > 10^4)."
  ],
  "learningResources": [
    "LeetCode Pattern: Sliding Window & Two Pointers",
    "NeetCode 150 - Core Data Structures"
  ]
}
`;

const buildCodingPlatformResult = (problemStatement) => ({
  source: 'local',
  language: 'javascript',
  problemStatement,
  isOptimal: null,
  recommendedDataStructures: [],
  hints: [
    'Submit a valid problem statement and code to receive hint-based feedback.',
  ],
  approachExplanation: '',
  commonMistakes: [],
  learningResources: [],
  isDSA: true,
  category: 'DSA',
});

const issuesToText = (issues = []) => {
  if (!Array.isArray(issues)) return [];
  return issues.map((issue) => {
    const parts = [];
    if (issue.title) parts.push(issue.title);
    if (issue.severity) parts.push(`[${issue.severity}]`);
    if (issue.line) parts.push(`Line ${issue.line}`);
    if (issue.description) parts.push(issue.description);
    if (issue.fix) parts.push(`Fix: ${issue.fix}`);
    return parts.join(' — ');
  });
};

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
      language = 'javascript',
      snippetId,
      versionNumber,
      problemStatement = '',
      codingPlatformMode = false,
    } = req.body || {};
    const normalizedCode = String(code || '').trim();

    if (!normalizedCode) {
      return res.status(400).json({ message: 'Code is required for analysis.' });
    }

    if (!req.user?.id) {
      return res.status(401).json({ message: 'Please sign in to run AI code analysis.' });
    }

    const normalizedVersion = Number(versionNumber || 1);
    const activeSnippetId = snippetId;

    if (activeSnippetId) {
      const Snippet = (await import('../models/Snippet.js')).default;
      const snippet = await Snippet.findById(activeSnippetId).lean();
      if (!snippet) {
        return res.status(404).json({ message: 'Snippet not found' });
      }
      if (!snippet.isPublic && snippet.owner.toString() !== req.user.id) {
        return res.status(403).json({ message: 'You can only analyze your own private snippets.' });
      }
    }

    // Cooldown check
    const cooldownRemaining = checkCooldown(req.user.id);
    if (cooldownRemaining > 0) {
      return res.status(429).json({
        message: `Please wait ${cooldownRemaining} seconds before requesting AI analysis again.`,
      });
    }

    // --- Coding Platform Mode ---
    if (codingPlatformMode && problemStatement.trim()) {
      markRequest(req.user.id);

      const cached = await Analysis.findOne({
        snippetId: activeSnippetId,
        versionNumber: normalizedVersion,
        problemStatement: { $exists: true, $ne: '' },
      }).lean();

      if (cached && cached.isOptimal !== null) {
        return res.json({
          source: cached.source,
          isOptimal: cached.isOptimal,
          approachExplanation: cached.approachExplanation,
          recommendedDataStructures: cached.recommendedDataStructures || [],
          hints: cached.hints || [],
          commonMistakes: cached.commonMistakes || [],
          learningResources: cached.learningResources || [],
          problemStatement: cached.problemStatement,
          fromCache: true,
          groqEnabled: Boolean(cached.groqEnabled),
          groqError: cached.groqError || '',
          category: 'DSA',
          isDSA: true,
        });
      }

      if (!process.env.GROQ_API_KEY) {
        return res.json({
          ...buildCodingPlatformResult(problemStatement),
          groqEnabled: false,
          groqError: 'AI service is temporarily unavailable. Please provide GROQ_API_KEY to enable mentor analysis.',
        });
      }

      const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'system',
              content: 'You are a strict code analysis engine. Return JSON only and nothing else. Do not include markdown fences, comments, or any extra text outside the JSON object.',
            },
            {
              role: 'user',
              content: promptForCodingPlatform(normalizedCode, language, problemStatement),
            },
          ],
          temperature: 0.1,
          max_tokens: 2048,
          top_p: 0.8,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        console.warn('Groq coding-platform analysis unavailable:', text.slice(0, 200));
        return res.json({
          ...buildCodingPlatformResult(problemStatement),
          groqEnabled: true,
          groqError: 'AI service is temporarily unavailable. Please try again later.',
        });
      }

      const payload = await response.json();
      const text = payload?.choices?.[0]?.message?.content || '';
      const parsed = extractGroqJson(text) || {};

      const result = {
        source: 'groq',
        language,
        problemStatement,
        isOptimal: parsed.isOptimal ?? false,
        approachExplanation: parsed.approachExplanation || '',
        recommendedDataStructures: Array.isArray(parsed.recommendedDataStructures) ? parsed.recommendedDataStructures : [],
        hints: Array.isArray(parsed.hints) ? parsed.hints : [],
        commonMistakes: Array.isArray(parsed.commonMistakes) ? parsed.commonMistakes : [],
        learningResources: Array.isArray(parsed.learningResources) ? parsed.learningResources : [],
        analysisErrors: [],
        category: 'DSA',
        isDSA: true,
        groqEnabled: true,
        groqError: '',
      };

      if (activeSnippetId) {
        await Analysis.findOneAndUpdate(
          {
            snippetId: activeSnippetId,
            versionNumber: normalizedVersion,
          },
          {
            $set: {
              explanation: result.approachExplanation,
              category: result.category,
              isDSA: result.isDSA,
              source: result.source,
              groqEnabled: true,
              groqError: '',
              problemStatement: result.problemStatement,
              isOptimal: result.isOptimal,
              recommendedDataStructures: result.recommendedDataStructures,
              hints: result.hints,
              commonMistakes: result.commonMistakes,
              learningResources: result.learningResources,
            },
          },
          { upsert: true, new: true }
        );
      }

      return res.json(result);
    }

    // --- Standard Code Review Mode ---
    const cached = await Analysis.findOne({
      snippetId: activeSnippetId,
      versionNumber: normalizedVersion,
    }).lean();

    if (cached && (cached.overallScore > 0 || cached.explanation)) {
      markRequest(req.user.id);
      return res.json({
        ...cached,
        fromCache: true,
        groqEnabled: Boolean(cached.groqEnabled),
        groqError: cached.groqError || '',
        analysisErrors: cached.analysisErrors || [],
        errors: cached.analysisErrors || [],
        issues: cached.issues || [],
        strengths: cached.strengths || [],
        suggestions: cached.suggestions || [],
        securityIssues: cached.securityIssues || [],
        performanceImprovements: cached.performanceImprovements || [],
        futureSuggestions: cached.futureSuggestions || [],
        designPatterns: cached.designPatterns || [],
        correctedCode: cached.correctedCode || '',
        optimizedCode: cached.optimizedCode || '',
        interviewQuestions: cached.interviewQuestions || [],
        learningResources: cached.learningResources || [],
        category: cached.category || '',
        subCategory: cached.subCategory || '',
        isDSA: cached.isDSA ?? false,
        timeComplexity: cached.complexity?.timeComplexity || cached.timeComplexity || '',
        spaceComplexity: cached.complexity?.spaceComplexity || cached.spaceComplexity || '',
        algorithm: cached.complexity?.algorithm || cached.algorithm || '',
        approach: cached.approach || '',
        overallScore: cached.overallScore || 0,
        ratings: cached.ratings || { performance: 0, readability: 0, maintainability: 0, security: 0, scalability: 0 },
      });
    }

    const fallbackResult = buildFallbackAnalysis(normalizedCode, String(language || 'javascript').trim().toLowerCase());

    if (!process.env.GROQ_API_KEY) {
      markRequest(req.user.id);
      const localResult = {
        ...fallbackResult,
        source: 'local',
        groqEnabled: false,
        groqError: 'AI service is temporarily unavailable. Showing cached/local analysis instead.',
      };
      return res.json(localResult);
    }

    const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: 'You are a strict code analysis engine. Return JSON only and nothing else. Do not include markdown fences, comments, or any extra text outside the JSON object.',
          },
          {
            role: 'user',
            content: promptForGroq(normalizedCode, language),
          },
        ],
        temperature: 0.1,
        max_tokens: 2048,
        top_p: 0.8,
      }),
    });

    if (!response.ok) {
      markRequest(req.user.id);
      const text = await response.text();
      console.warn('Groq analysis unavailable, using fallback:', text.slice(0, 200));
      const localResult = {
        ...fallbackResult,
        source: 'local',
        groqEnabled: true,
        groqError: 'AI service is temporarily unavailable. Showing cached/local analysis instead.',
      };
      return res.json(localResult);
    }

    const payload = await response.json();
    const text = payload?.choices?.[0]?.message?.content || '';
    const parsed = extractGroqJson(text) || {};

    const rawIssues = Array.isArray(parsed.issues) ? parsed.issues : [];
    const formattedIssues = rawIssues.map((iss) => ({
      title: iss.title || '',
      severity: ['Low', 'Medium', 'High', 'Critical'].includes(iss.severity) ? iss.severity : 'Medium',
      line: Number.isFinite(Number(iss.line)) && Number(iss.line) > 0 ? Number(iss.line) : null,
      column: Number.isFinite(Number(iss.column)) && Number(iss.column) > 0 ? Number(iss.column) : null,
      description: iss.description || '',
      fix: iss.fix || '',
    }));

    const issueTexts = issuesToText(formattedIssues);
    const errorLineNumbers = extractErrorLinesFromIssues(formattedIssues);

    const result = {
      source: 'groq',
      groqEnabled: true,
      groqError: '',
      language,
      category: parsed.category || fallbackResult.category || 'Other',
      subCategory: parsed.subCategory || fallbackResult.subCategory || '',
      isDSA: parsed.isDSA ?? fallbackResult.isDSA ?? false,
      hasSyntaxErrors: parsed.hasSyntaxErrors ?? (errorLineNumbers.length > 0),
      errorLines: errorLineNumbers,
      overallScore: Number.isFinite(Number(parsed.overallScore)) ? Number(parsed.overallScore) : fallbackResult.overallScore,
      ratings: parsed.ratings || fallbackResult.ratings,
      algorithm: parsed.algorithm || fallbackResult.algorithm || '',
      approach: parsed.approach || fallbackResult.approach || '',
      timeComplexity: parsed.timeComplexity || fallbackResult.timeComplexity || '',
      spaceComplexity: parsed.spaceComplexity || fallbackResult.spaceComplexity || '',
      dataStructureRecommendations: parsed.dataStructureRecommendations || '',
      explanation: parsed.explanation || fallbackResult.explanation,
      summary: parsed.summary || fallbackResult.summary || '',
      issues: formattedIssues.length > 0 ? formattedIssues : fallbackResult.issues,
      analysisErrors: issueTexts.length > 0 ? issueTexts : fallbackResult.analysisErrors,
      errors: issueTexts.length > 0 ? issueTexts : fallbackResult.analysisErrors,
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : fallbackResult.strengths,
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : fallbackResult.suggestions,
      securityIssues: Array.isArray(parsed.securityIssues) ? parsed.securityIssues : fallbackResult.securityIssues,
      performanceImprovements: Array.isArray(parsed.performanceImprovements) ? parsed.performanceImprovements : fallbackResult.performanceImprovements,
      futureSuggestions: Array.isArray(parsed.futureSuggestions) ? parsed.futureSuggestions : fallbackResult.futureSuggestions,
      designPatterns: Array.isArray(parsed.designPatterns) ? parsed.designPatterns : fallbackResult.designPatterns,
      correctedCode: parsed.correctedCode || '',
      optimizedCode: parsed.optimizedCode || '',
      interviewQuestions: Array.isArray(parsed.interviewQuestions) ? parsed.interviewQuestions : fallbackResult.interviewQuestions,
      learningResources: Array.isArray(parsed.learningResources) ? parsed.learningResources : fallbackResult.learningResources,
      complexity: {
        algorithm: parsed.algorithm || fallbackResult.algorithm,
        timeComplexity: parsed.timeComplexity || fallbackResult.timeComplexity,
        spaceComplexity: parsed.spaceComplexity || fallbackResult.spaceComplexity,
      },
    };

    if (activeSnippetId) {
      await Analysis.findOneAndUpdate(
        {
          snippetId: activeSnippetId,
          versionNumber: normalizedVersion,
        },
        {
          $set: {
            category: result.category,
            subCategory: result.subCategory,
            isDSA: result.isDSA,
            hasSyntaxErrors: result.hasSyntaxErrors,
            errorLines: result.errorLines,
            overallScore: result.overallScore,
            ratings: result.ratings,
            algorithm: result.algorithm,
            approach: result.approach,
            complexity: result.complexity,
            dataStructureRecommendations: result.dataStructureRecommendations,
            explanation: result.explanation,
            summary: result.summary,
            issues: result.issues,
            analysisErrors: result.analysisErrors,
            strengths: result.strengths,
            suggestions: result.suggestions,
            securityIssues: result.securityIssues,
            performanceImprovements: result.performanceImprovements,
            futureSuggestions: result.futureSuggestions,
            designPatterns: result.designPatterns,
            correctedCode: result.correctedCode,
            optimizedCode: result.optimizedCode,
            interviewQuestions: result.interviewQuestions,
            learningResources: result.learningResources,
            source: result.source,
            groqEnabled: true,
            groqError: '',
          },
        },
        { upsert: true, new: true }
      );
    }

    markRequest(req.user.id);
    return res.json(result);
  } catch (error) {
    console.warn('Analysis error, using fallback:', error.message);
    return res.json({
      ...buildFallbackAnalysis(req.body?.code || '', req.body?.language || 'javascript'),
      source: 'local',
      groqEnabled: true,
      groqError: 'AI service is temporarily unavailable. Showing cached/local analysis instead.',
      errors: [],
    });
  }
};
