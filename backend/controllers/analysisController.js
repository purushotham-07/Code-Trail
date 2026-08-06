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
    timeComplexity: 'O(log n)',
    spaceComplexity: 'O(1)',
    explanation: 'The code repeatedly halves the search range, so the work grows logarithmically with input size.',
    analysisErrors: [],
    suggestions: [
      'Use left + (right - left) / 2 to avoid integer overflow when computing the midpoint.',
      'Add input validation for empty or null arrays before searching.',
    ],
    category: 'DSA',
    isDSA: true,
  },
  mergeSort: {
    algorithm: 'Merge Sort',
    timeComplexity: 'O(n log n)',
    spaceComplexity: 'O(n)',
    explanation: 'The array is split recursively and merged back together, producing a stable divide-and-conquer runtime.',
    analysisErrors: [],
    suggestions: [
      'Consider an in-place merge variant to reduce the O(n) auxiliary space.',
      'Add a base-case threshold to switch to insertion sort for small subarrays.',
    ],
    category: 'DSA',
    isDSA: true,
  },
  bfs: {
    algorithm: 'Breadth-First Search',
    timeComplexity: 'O(V + E)',
    spaceComplexity: 'O(V)',
    explanation: 'Graph traversal visits each vertex and each edge once, which makes the runtime linear in the graph size.',
    analysisErrors: [],
    suggestions: [
      'Use a visited set to prevent revisiting nodes in cyclic graphs.',
      'Consider early termination once the target node is found.',
    ],
    category: 'DSA',
    isDSA: true,
  },
  dfs: {
    algorithm: 'Depth-First Search',
    timeComplexity: 'O(V + E)',
    spaceComplexity: 'O(V)',
    explanation: 'Depth-first traversal explores each node and its descendants recursively, keeping the stack proportional to the depth.',
    analysisErrors: [],
    suggestions: [
      'Convert recursive DFS to an iterative stack-based approach to avoid stack overflow on deep graphs.',
      'Track visited nodes to prevent infinite loops in cyclic graphs.',
    ],
    category: 'DSA',
    isDSA: true,
  },
  bubbleSort: {
    algorithm: 'Bubble Sort',
    timeComplexity: 'O(n^2)',
    spaceComplexity: 'O(1)',
    explanation: 'Adjacent elements are repeatedly swapped until the array is ordered, which leads to quadratic runtime in the worst case.',
    analysisErrors: [],
    suggestions: [
      'Add an early-exit flag when no swaps occur in a pass to improve best-case to O(n).',
      'Consider replacing bubble sort with a more efficient algorithm like quicksort or merge sort for large inputs.',
    ],
    category: 'DSA',
    isDSA: true,
  },
  dynamicProgramming: {
    algorithm: 'Dynamic Programming',
    timeComplexity: 'O(n * m)',
    spaceComplexity: 'O(n * m)',
    explanation: 'The state is reused over a table of overlapping subproblems, which reduces repeated work across the search space.',
    analysisErrors: [],
    suggestions: [
      'Optimize space by keeping only the previous row/column when the state depends only on adjacent values.',
      'Add memoization to avoid recomputing overlapping subproblems.',
    ],
    category: 'DSA',
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
    algorithm: 'Unrecognized pattern',
    timeComplexity: 'N/A',
    spaceComplexity: 'N/A',
    explanation: 'No standard DSA pattern could be confidently inferred from the sample code.',
    analysisErrors: [],
    suggestions: [
      'Add meaningful variable and function names to improve readability.',
      'Include error handling for edge cases and unexpected inputs.',
      'Add comments to explain non-obvious logic.',
    ],
    category: 'Other',
    isDSA: false,
  };

  return {
    source: 'fallback',
    language,
    algorithm: match.algorithm,
    timeComplexity: match.timeComplexity,
    spaceComplexity: match.spaceComplexity,
    explanation: match.explanation,
    analysisErrors: match.analysisErrors,
    suggestions: match.suggestions,
    category: match.category,
    isDSA: match.isDSA,
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
 * Standard analysis prompt — used for general code review.
 *
 * Key enhancements over the original prompt:
 *  1. Explicitly asks the model to include exact line numbers (and column where
 *     possible) for every syntax / runtime / logical error so the frontend can
 *     highlight the offending line in the editor.
 *  2. For DSA problems, asks for a detailed "optimization approach" that
 *     recommends specific data structures (array, hashmap, heap, tree, etc.)
 *     and explains *why* each one helps.
 */
const promptForGroq = (code, language) => `
You are an expert Software Engineer, DSA Expert, Code Reviewer, Technical Interviewer, System Designer, and Security Auditor.

Your task is to analyze the given ${language} code accurately.

IMPORTANT RULES
- Return ONLY valid JSON.
- Do NOT use markdown.
- Do NOT wrap JSON inside \`\`\`.
- Do NOT return explanations outside JSON.
- Never invent information.
- Never report fake issues.
- If no issue exists, return an empty array.
- If the code is already optimal, return "Already Optimal" in optimizedCode.
- If the submitted code contains errors, first provide the corrected version before suggesting an optimized solution.
- Suggest a better algorithm ONLY if one actually exists.

----------------------------------------
STEP 1 — Category

Determine the category: DSA | Backend | Frontend | Full Stack | API | Database | Machine Learning | Other

----------------------------------------
STEP 2 — Find real issues (with exact locations)

Check for:
- Syntax Errors
- Logical Bugs
- Runtime Errors
- Edge Cases
- Memory Issues
- Performance Bottlenecks
- Code Smells
- Readability Problems
- Maintainability Problems
- Security Vulnerabilities

For EVERY issue, you MUST include:
- title: short one-line summary
- severity: Low | Medium | High | Critical
- line: the 1-based line number where the issue starts
- column: the 1-based column number (best effort)
- description: what the problem is
- fix: how to fix it

If the code has NO syntax errors, set hasSyntaxErrors = false.
If there ARE syntax errors, set hasSyntaxErrors = true and list them with exact line and column.

----------------------------------------
STEP 3 (DSA only) — Approach & Data Structure Recommendations

Identify:
- Algorithm name
- Algorithm pattern
- Approach: Brute Force | Better | Optimal
- Time Complexity
- Space Complexity

For the optimization approach, recommend SPECIFIC data structures (e.g., HashMap, TreeSet, Heap, Segment Tree, Disjoint Set Union, Monotonic Deque, Trie, etc.) and explain WHY each one improves the solution.

If the submitted solution is incorrect:
- Explain why
- Generate correctedCode

If a better algorithm exists:
- Explain why it is better
- Recommend the data structures that make the better algorithm work
- Generate optimizedCode with lower TC/SC

Otherwise:
- optimizedCode = "Already Optimal"

Provide:
- Dry Run
- Interview Tips
- Common Mistakes

----------------------------------------
STEP 4 (Non-DSA) — Architecture review
Review: Architecture | Folder Structure | Reusability | Modularity | Naming | Error Handling | Validation | Authentication | Authorization | Database Usage | API Design | Performance | Scalability | Security | Clean Code Principles

----------------------------------------
STEP 5 — Rate (1-10): Code Quality | Performance | Readability | Maintainability | Security | Scalability

----------------------------------------
STEP 6 — Suggest improvements: Refactoring | Better Naming | Better Data Structures | Better Algorithms | Better Libraries | Design Patterns | Performance Improvements | Future Improvements

----------------------------------------
STEP 7 — Generate improved code ONLY if meaningful improvements exist.
Do NOT rewrite code just for formatting.

Return exactly this JSON:

{
  "category":"",
  "subCategory":"",
  "isDSA":false,
  "hasSyntaxErrors":false,

  "overallScore":0,

  "ratings":{
    "performance":0,
    "readability":0,
    "maintainability":0,
    "security":0,
    "scalability":0
  },

  "algorithm":"",
  "approach":"",
  "timeComplexity":"",
  "spaceComplexity":"",
  "dataStructureRecommendations":"",

  "issues":[
    {
      "title":"",
      "severity":"Low | Medium | High | Critical",
      "line":"",
      "column":"",
      "description":"",
      "fix":""
    }
  ],

  "strengths":[],

  "suggestions":[],

  "securityIssues":[],

  "performanceImprovements":[],

  "futureSuggestions":[],

  "designPatterns":[],

  "correctedCode":"",

  "optimizedCode":"",

  "explanation":"",

  "interviewQuestions":[],

  "learningResources":[],

  "summary":""
}

Language: ${language}

Code:
${code}
`;

/*
 * Coding-platform prompt — used when problemStatement is provided.
 *
 * Instead of giving a full optimized solution, the model is instructed to:
 *  1. Determine whether the user's approach is optimal for the stated
 *     problem.
 *  2. If NOT optimal, provide HINTS about which data structures or
 *     algorithmic patterns to consider — without handing over the answer.
 *  3. Recommend specific data structures and explain why they fit the
 *     problem constraints.
 */
const promptForCodingPlatform = (code, language, problemStatement) => `
You are an expert DSA coach and competitive-programming mentor.

The user has pasted a coding-platform problem below, along with their
attempted solution.  Your job is to act as a patient mentor: check whether
their approach is optimal, and if it is not, give them HINTS — not full
solutions — that steer them toward the right data structures and algorithmic
patterns.

STRICT RULES
- Return ONLY valid JSON. No markdown, no fences, no prose outside JSON.
- Never invent information.
- If the approach IS optimal, say so and provide brief confirmation.
- If the approach is NOT optimal, provide 2-4 actionable hints that mention
  the recommended data structures (e.g., HashMap, Heap, Segment Tree,
  Disjoint Set Union, Monotonic Deque, etc.) and explain WHY each helps with
  the problem's constraints.
- Do NOT give the complete optimized code.  Provide only hints.

PROBLEM STATEMENT:
${problemStatement}

Return exactly this JSON shape:

{
  "isOptimal": false,
  "approachExplanation": "A clear explanation of the user's current approach and whether it is optimal.",
  "recommendedDataStructures": ["HashMap — to achieve O(1) lookups ...", "Min-Heap — to maintain the k largest element ..."],
  "hints": [
    "Hint 1: What data structure gives you O(1) average-time lookups? How could that eliminate the inner loop?",
    "Hint 2: Think about the problem constraints (N up to 10^5). What is the complexity of your current approach? Can a monotonic deque or a sliding-window pattern reduce it to O(N)?"
  ],
  "commonMistakes": ["...", "..."],
  "learningResources": ["Link or resource name", "..."]
}

Language: ${language}

User's code:
${code}
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
});

/*
 * Convert an array of {title, severity, line, column, ...} issue objects
 * into plain-text strings that the frontend can parse for line numbers AND
 * display in the error sidebar.
 */
const issuesToText = (issues = []) => {
  if (!Array.isArray(issues)) return [];
  return issues.map((issue) => {
    const parts = [];
    if (issue.title) parts.push(issue.title);
    if (issue.severity) parts.push(`(${issue.severity})`);
    if (issue.line) parts.push(`Line ${issue.line}`);
    if (issue.column) parts.push(`col ${issue.column}`);
    if (issue.description) parts.push(issue.description);
    if (issue.fix) parts.push(`Fix: ${issue.fix}`);
    return parts.join(' — ');
  });
};

/*
 * Extract unique, positive line numbers from an array of issue objects so
 * that the frontend can highlight them inside the CodeMirror editor.
 */
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

    // Keep a check on API requests — cooldown to prevent rate-limit abuse.
    const cooldownRemaining = checkCooldown(req.user.id);
    if (cooldownRemaining > 0) {
      return res.status(429).json({
        message: `Please wait ${cooldownRemaining} seconds before requesting AI analysis again.`,
      });
    }

    // --- Coding Platform Mode ---
    // When a problem statement is supplied, the analysis takes a hint-based
    // mentoring approach instead of a full code review.
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
        });
      }

      if (!process.env.GROQ_API_KEY) {
        return res.json({
          ...buildCodingPlatformResult(problemStatement),
          groqEnabled: false,
          groqError: 'AI service is temporarily unavailable. Please provide a GROQ_API_KEY to enable coding-platform analysis.',
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
      };

      // Persist the coding-platform analysis for caching.
      // Use findOneAndUpdate with upsert to avoid E11000 duplicate key errors
      // when concurrent requests target the same snippetId + versionNumber.
      // $setOnInsert ensures existing documents are left untouched.
      await Analysis.findOneAndUpdate(
        {
          snippetId: activeSnippetId || null,
          versionNumber: normalizedVersion,
        },
        {
          $setOnInsert: {
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
            analysisErrors: [],
            suggestions: [],
          },
        },
        { upsert: true },
      );

      return res.json(result);
    }

    // --- Standard Code Review Mode ---

    // Check for cached standard analysis.
    const cached = await Analysis.findOne({
      snippetId: activeSnippetId,
      versionNumber: normalizedVersion,
    }).lean();

    if (cached) {
      markRequest(req.user.id);
      return res.json({
        ...cached,
        fromCache: true,
        groqEnabled: Boolean(cached.groqEnabled),
        groqError: cached.groqError || '',
        analysisErrors: cached.analysisErrors || [],
        errors: cached.analysisErrors || [],
        suggestions: cached.suggestions || [],
        futureSuggestions: cached.futureSuggestions || [],
        optimizedCode: cached.optimizedCode || '',
        category: cached.category || '',
        isDSA: cached.isDSA ?? false,
        timeComplexity: cached.complexity?.timeComplexity || cached.timeComplexity || '',
        spaceComplexity: cached.complexity?.spaceComplexity || cached.spaceComplexity || '',
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
        errors: fallbackResult.analysisErrors,
        timeComplexity: fallbackResult.timeComplexity,
        spaceComplexity: fallbackResult.spaceComplexity,
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
        errors: fallbackResult.analysisErrors,
        timeComplexity: fallbackResult.timeComplexity,
        spaceComplexity: fallbackResult.spaceComplexity,
      };
      return res.json(localResult);
    }

    const payload = await response.json();
    const text = payload?.choices?.[0]?.message?.content || '';
    const parsed = extractGroqJson(text) || {};

    // Convert structured issues [{title, line, column, ...}] into plain-text
    // strings for the sidebar display, and also collect line numbers for
    // editor highlighting.
    const issuesArray = Array.isArray(parsed.issues) ? parsed.issues : [];
    const issueTexts = issuesToText(issuesArray);
    const errorLineNumbers = extractErrorLinesFromIssues(issuesArray);

    const result = {
      ...fallbackResult,
      ...parsed,
      source: 'groq',
      groqEnabled: true,
      language,
      category: parsed.category || fallbackResult.category || 'Other',
      isDSA: parsed.isDSA ?? fallbackResult.isDSA ?? false,
      hasSyntaxErrors: parsed.hasSyntaxErrors ?? false,
      errorLines: errorLineNumbers,
      analysisErrors: parsed.issues
        ? issueTexts.length > 0 ? issueTexts : fallbackResult.analysisErrors
        : fallbackResult.analysisErrors,
      // Backwards-compat alias for the frontend
      errors: parsed.issues
        ? issueTexts.length > 0 ? issueTexts : fallbackResult.analysisErrors
        : fallbackResult.analysisErrors,
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : fallbackResult.suggestions,
      futureSuggestions: Array.isArray(parsed.futureSuggestions) ? parsed.futureSuggestions : [],
      optimizedCode: parsed.optimizedCode || '',
      explanation: parsed.explanation || fallbackResult.explanation,
      dataStructureRecommendations: parsed.dataStructureRecommendations || '',
      complexity: {
        algorithm: parsed.algorithm || fallbackResult.algorithm,
        timeComplexity: parsed.timeComplexity || fallbackResult.timeComplexity,
        spaceComplexity: parsed.spaceComplexity || fallbackResult.spaceComplexity,
      },
    };

    // Ensure we always store something under analysisErrors
    const dbErrors = result.analysisErrors.length > 0
      ? result.analysisErrors
      : (Array.isArray(parsed.issues) ? issuesToText(parsed.issues) : fallbackResult.analysisErrors);

    // Use findOneAndUpdate with upsert to avoid E11000 duplicate key errors
    // when concurrent requests target the same snippetId + versionNumber.
    // $setOnInsert ensures existing documents are left untouched.
    await Analysis.findOneAndUpdate(
      {
        snippetId: activeSnippetId,
        versionNumber: normalizedVersion,
      },
      {
        $setOnInsert: {
          explanation: result.explanation,
          complexity: result.complexity,
          suggestions: result.suggestions,
          futureSuggestions: result.futureSuggestions,
          analysisErrors: dbErrors,
          category: result.category,
          isDSA: result.isDSA,
          hasSyntaxErrors: result.hasSyntaxErrors,
          errorLines: errorLineNumbers,
          source: result.source,
          groqEnabled: result.groqEnabled,
          groqError: '',
          optimizedCode: result.optimizedCode,
          dataStructureRecommendations: result.dataStructureRecommendations,
          ...(codingPlatformMode && problemStatement.trim()
            ? { problemStatement, isOptimal: result.isOptimal, hints: result.hints }
            : {}),
        },
      },
      { upsert: true },
    );

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
