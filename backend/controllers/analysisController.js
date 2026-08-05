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
    errors: [],
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
    errors: [],
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
    errors: [],
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
    errors: [],
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
    errors: [],
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
    errors: [],
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
    errors: [],
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
    errors: match.errors,
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

const promptForGroq = (code, language) => {
  return [
    'You are a strict code analysis engine. Return JSON only and nothing else.',
    'Important: do not include markdown fences, comments, or any extra text outside the JSON object.',
    '',
    'Analyze the complete code supplied below and:',
    '1. Identify any errors, bugs, or issues in the code.',
    '2. Determine if this is a DSA (Data Structures & Algorithms) problem or a Full-Stack / general programming problem.',
    '3. If it IS a DSA problem (any language):',
    '   - Provide the algorithm name, time complexity (TC), and space complexity (SC).',
    '   - Explain how to decrease TC and SC with concrete optimization strategies.',
    '   - Provide an optimizedCode snippet showing the improved version with lower TC/SC.',
    '4. If it is NOT a DSA problem (e.g., full-stack, web dev, API, UI, database, etc.):',
    '   - Do NOT provide time/space complexity.',
    '   - Provide specific, practical improvement suggestions with good code practices.',
    '   - Provide an optimizedCode snippet showing the improved, cleaner, more maintainable version.',
    '5. Provide suggestions for future requirements and scalability — how the code could be extended, scaled, or improved to handle future needs.',
    '',
    'Use this JSON shape exactly:',
    '{',
    '  "category": "DSA" | "Full-Stack" | "Other",',
    '  "isDSA": true or false,',
    '  "algorithm": "...",  // only if DSA, otherwise empty string',
    '  "timeComplexity": "...",  // only if DSA, otherwise empty string',
    '  "spaceComplexity": "...",  // only if DSA, otherwise empty string',
    '  "errors": ["...", "..."],  // list of errors/bugs found, empty array if none',
    '  "suggestions": ["...", "..."],  // improvement suggestions',
    '  "optimizedCode": "...",  // code snippet showing the optimized/improved version',
    '  "futureSuggestions": ["...", "..."],  // suggestions for future requirements, scalability, and extensibility',
    '  "explanation": "..."  // general explanation of the code',
    '}',
    '',
    `Language: ${language}`,
    'Code:',
    code,
  ].join('\n');
};

export const analyzeSnippetCode = async (req, res) => {
  try {
    const { code = '', language = 'javascript', snippetId, versionNumber } = req.body || {};
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
        errors: cached.errors || [],
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

    const result = {
      ...fallbackResult,
      ...parsed,
      source: 'groq',
      groqEnabled: true,
      language,
      category: parsed.category || fallbackResult.category || 'Other',
      isDSA: parsed.isDSA ?? fallbackResult.isDSA ?? false,
      errors: Array.isArray(parsed.errors) ? parsed.errors : [],
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : fallbackResult.suggestions,
      futureSuggestions: Array.isArray(parsed.futureSuggestions) ? parsed.futureSuggestions : [],
      optimizedCode: parsed.optimizedCode || '',
      explanation: parsed.explanation || fallbackResult.explanation,
      complexity: {
        algorithm: parsed.algorithm || fallbackResult.algorithm,
        timeComplexity: parsed.timeComplexity || fallbackResult.timeComplexity,
        spaceComplexity: parsed.spaceComplexity || fallbackResult.spaceComplexity,
      },
    };

    await Analysis.create({
      snippetId: activeSnippetId,
      versionNumber: normalizedVersion,
      explanation: result.explanation,
      complexity: result.complexity,
      suggestions: result.suggestions,
      futureSuggestions: result.futureSuggestions,
      optimizedCode: result.optimizedCode,
      errors: result.errors,
      category: result.category,
      isDSA: result.isDSA,
      source: result.source,
      groqEnabled: result.groqEnabled,
      groqError: '',
    });

    markRequest(req.user.id);
    return res.json(result);
  } catch (error) {
    console.warn('Analysis error, using fallback:', error.message);
    return res.json({
      ...buildFallbackAnalysis(req.body?.code || '', req.body?.language || 'javascript'),
      source: 'local',
      groqEnabled: true,
      groqError: 'AI service is temporarily unavailable. Showing cached/local analysis instead.',
    });
  }
};
