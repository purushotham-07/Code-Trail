import mongoose from 'mongoose';
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

const CANDIDATE_MODELS = [
  process.env.GROQ_MODEL,
  'openai/gpt-oss-120b',
  'openai/gpt-oss-20b',
  'groq/compound',
].filter(Boolean);

/**
 * Deterministic static syntax and parser pre-check.
 * Runs instantly for all languages to catch obvious syntax mistakes, unclosed brackets,
 * missing colons in Python, invalid for-loop syntax in JS, JSON parse failures, and SQL errors.
 */
export const detectStaticSyntaxErrors = (code = '', language = 'javascript') => {
  const issues = [];
  const lang = String(language || 'javascript').trim().toLowerCase();
  const lines = code.split('\n');

  // 1. Bracket & Brace matching across all languages
  const stack = [];
  const pairs = { '}': '{', ')': '(', ']': '[' };
  const opening = new Set(['{', '(', '[']);
  const closing = new Set(['}', ')', ']']);

  lines.forEach((lineText, lineIdx) => {
    const lineNum = lineIdx + 1;
    // Skip comments
    const trimmed = lineText.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('#') || trimmed.startsWith('/*')) return;

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
              description: `Found unexpected '${ch}' with no matching '${pairs[ch]}'.`,
              fix: `Remove the extra '${ch}' or add the opening '${pairs[ch]}'.`,
            });
          } else {
            stack.pop();
          }
        }
      }
    }
  });

  // Any unclosed opening brackets
  if (stack.length > 0) {
    const unclosed = stack.pop();
    issues.push({
      title: `Unclosed bracket '${unclosed.char}'`,
      severity: 'Critical',
      line: unclosed.line,
      column: unclosed.col,
      description: `Bracket '${unclosed.char}' was opened on line ${unclosed.line} but never closed.`,
      fix: `Add matching closing bracket '${unclosed.char === '{' ? '}' : unclosed.char === '(' ? ')' : ']'}' before the end of block.`,
    });
  }

  // 2. Python-specific syntax validation
  if (lang === 'python') {
    const blockHeaders = /^\s*(def\s+[a-zA-Z_][a-zA-Z0-9_]*\s*\(.*\)|if\s+.*|elif\s+.*|else|for\s+.*|while\s+.*|class\s+[a-zA-Z_][a-zA-Z0-9_]*.*|try|except.*|finally)\s*$/;
    lines.forEach((lineText, lineIdx) => {
      const lineNum = lineIdx + 1;
      const trimmed = lineText.trim();
      if (!trimmed || trimmed.startsWith('#')) return;

      if (blockHeaders.test(trimmed) && !trimmed.endsWith(':')) {
        issues.push({
          title: 'Missing colon in statement header',
          severity: 'Critical',
          line: lineNum,
          column: lineText.length,
          description: `Python compound statement "${trimmed}" must end with a colon (:).`,
          fix: `Append ':' at the end of line ${lineNum}: "${trimmed}:"`,
        });
      }
    });
  }

  // 3. JavaScript / TypeScript for-loop separator check
  if (lang === 'javascript' || lang === 'typescript') {
    lines.forEach((lineText, lineIdx) => {
      const lineNum = lineIdx + 1;
      const forMatch = lineText.match(/for\s*\(\s*(?:let|var|const)\s+[^;)]+\)/);
      if (forMatch && !lineText.includes(' of ') && !lineText.includes(' in ')) {
        const semicolons = (forMatch[0].match(/;/g) || []).length;
        if (semicolons < 2) {
          issues.push({
            title: 'Syntax error in for loop header',
            severity: 'Critical',
            line: lineNum,
            column: lineText.indexOf('for'),
            description: 'Standard 3-part for-loop requires two semicolon separators: for (init; condition; update).',
            fix: 'Add the missing semicolon between the loop condition and the increment expression.',
          });
        }
      }
    });
  }

  // 4. JSON parse check
  if (lang === 'json') {
    try {
      JSON.parse(code);
    } catch (jsonErr) {
      const match = jsonErr.message.match(/position\s+(\d+)/i);
      let lineNum = 1;
      if (match) {
        const pos = Number(match[1]);
        lineNum = code.slice(0, pos).split('\n').length;
      }
      issues.push({
        title: 'JSON Parse Error',
        severity: 'Critical',
        line: lineNum,
        column: 1,
        description: jsonErr.message,
        fix: 'Ensure valid JSON format with double quotes around keys and no trailing commas.',
      });
    }
  }

  // 5. SQL keyword typo check
  if (lang === 'sql') {
    lines.forEach((lineText, lineIdx) => {
      const lineNum = lineIdx + 1;
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
      if (/^\s*GROUP\s+BY\s*$/i.test(lineText.trim())) {
        issues.push({
          title: 'Incomplete GROUP BY clause',
          severity: 'Critical',
          line: lineNum,
          column: 1,
          description: 'GROUP BY clause requires at least one column expression.',
          fix: 'Specify the grouping column(s), e.g., GROUP BY column_name.',
        });
      }
    });
  }

  return issues;
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
  return null;
};

const buildFallbackAnalysis = (code = '', language = 'javascript') => {
  const staticIssues = detectStaticSyntaxErrors(code, language);
  const key = detectAlgorithm(code);
  const match = FALLBACK_LIBRARY[key] || {
    algorithm: 'General Code Review',
    approach: 'Standard Implementation',
    timeComplexity: 'N/A',
    spaceComplexity: 'N/A',
    overallScore: staticIssues.length > 0 ? 3 : 7,
    ratings: {
      performance: 7,
      readability: staticIssues.length > 0 ? 4 : 8,
      maintainability: 7,
      security: 8,
      scalability: 7,
    },
    explanation: staticIssues.length > 0
      ? `Syntax errors detected in ${language} code. Please resolve the highlighted issues before executing.`
      : 'Code structure reviewed for syntax, clarity, error handling, and performance considerations.',
    summary: staticIssues.length > 0
      ? `Critical syntax errors detected on line(s): ${staticIssues.map((i) => i.line).join(', ')}.`
      : 'Standard implementation reviewed against general software design and clean code principles.',
    issues: staticIssues,
    strengths: staticIssues.length === 0 ? ['Readable logic flow and straightforward structure.'] : [],
    suggestions: [
      'Add meaningful variable and function names to improve self-documenting readability.',
      'Include robust error handling for unexpected inputs and null/undefined edge cases.',
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

  const allIssues = staticIssues.length > 0 ? staticIssues : (match.issues || []);
  const issueLines = Array.from(new Set(allIssues.map((i) => Number(i.line)).filter((n) => Number.isFinite(n) && n > 0))).sort((a, b) => a - b);

  return {
    source: 'fallback',
    language,
    algorithm: match.algorithm,
    approach: match.approach,
    timeComplexity: match.timeComplexity,
    spaceComplexity: match.spaceComplexity,
    overallScore: allIssues.length > 0 ? 3 : match.overallScore,
    ratings: match.ratings,
    explanation: match.explanation,
    summary: match.summary,
    issues: allIssues,
    analysisErrors: allIssues.map((i) => `${i.title} (Line ${i.line})`),
    errors: allIssues.map((i) => `${i.title} (Line ${i.line})`),
    errorLines: issueLines,
    hasSyntaxErrors: allIssues.some((i) => i.severity === 'Critical') || allIssues.length > 0,
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
 * Standard code analysis prompt — engineered for high precision syntax diagnostics & review.
 */
const promptForGroq = (code, language) => `
You are a Staff Software Engineer, Lead Compiler Diagnostics Engineer, and Code Quality Specialist.

Analyze the given ${language} code with extreme rigor and precision.

CRITICAL INSTRUCTIONS FOR SYNTAX & CODE ISSUES:
1. FIRST AND FOREMOST: Check for SYNTAX ERRORS, COMPILER ERRORS, and PARSE ERRORS for ${language}.
   - In ${language}, check for:
     * Python: missing colons (":") after def/if/elif/else/for/while/class/try/except, indentation errors, invalid syntax, unclosed brackets/quotes.
     * JavaScript/TypeScript: missing commas/semicolons/brackets, unexpected tokens, invalid assignments, unclosed strings/regex, for-loop syntax errors.
     * Java/C/C++: missing semicolons (";"), missing/mismatched braces ("{}"), undeclared types/variables, invalid function/method signatures.
     * SQL: misspelled keywords (e.g. "WHER"), missing clauses (e.g. "GROUP BY" with no columns), unclosed quotes, invalid syntax.
     * HTML/CSS/JSON: unclosed tags, invalid CSS properties, trailing commas or missing quotes in JSON.
   - If ANY syntax or parse error is present:
     * You MUST set "hasSyntaxErrors": true.
     * You MUST add every syntax error to the "issues" array with exact 1-based "line", "column", "severity": "Critical", clear "title", "description", and actionable "fix".
   - If the code has NO syntax errors, set "hasSyntaxErrors": false.

2. LOGICAL BUGS & RUNTIME ERRORS:
   - Check for off-by-one errors, null/undefined/nil dereferences, division by zero, infinite loops, array out-of-bounds, resource leaks, type errors.
   - Add them to "issues" with severity "High" or "Medium".

3. CODE GENERATION:
   - "correctedCode": If the code contains ANY syntax or logical errors, you MUST provide the complete, working, bug-free corrected version of the code in ${language}.
   - "optimizedCode": If the code can be optimized for better time/space complexity or cleaner architecture, provide the optimized version. If already optimal, return "".

STRICT OUTPUT FORMAT:
Return ONLY a single valid JSON object. Absolutely NO markdown wrapping (no \`\`\` or \`\`\`json).

{
  "category": "DSA | Frontend | Backend | Full Stack | Database | Security | Other",
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
  "explanation": "High-level summary of the code and findings.",
  "summary": "Concise summary.",
  "issues": [
    {
      "title": "Syntax Error / Issue summary",
      "severity": "Critical | High | Medium | Low",
      "line": 1,
      "column": 1,
      "description": "Clear explanation",
      "fix": "Exact fix"
    }
  ],
  "strengths": [],
  "suggestions": [],
  "securityIssues": [],
  "performanceImprovements": [],
  "futureSuggestions": [],
  "designPatterns": [],
  "correctedCode": "complete working code without syntax errors",
  "optimizedCode": "",
  "interviewQuestions": [],
  "learningResources": []
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
2. Check for syntax and runtime errors in ${language}. If present, set hasSyntaxErrors = true.
3. Provide 3 progressive hints:
   - Tier 1 (Intuition / High Level): Guides thinking on what pattern or property to observe.
   - Tier 2 (Data Structure & Complexity): Suggests ideal data structures (e.g. Monotonic Stack, Two Pointers, Fenwick Tree, Union-Find) and explains why they meet constraints.
   - Tier 3 (Algorithm & Edge Cases): Outlines key transitions and edge cases.
4. Highlight Common Mistakes.

PROBLEM STATEMENT:
${problemStatement}

CANDIDATE'S CODE (${language}):
${code}

EXPECTED JSON SCHEMA:
{
  "isOptimal": false,
  "hasSyntaxErrors": false,
  "approachExplanation": "Clear explanation of candidate's approach, complexity, and constraints fit.",
  "recommendedDataStructures": [
    "HashMap — achieves O(1) lookups to eliminate quadratic scanning",
    "Min-Heap — maintains top K elements in O(log K)"
  ],
  "hints": [
    "Hint 1 (Intuition): ...",
    "Hint 2 (Data Structure): ...",
    "Hint 3 (Edge Cases): ..."
  ],
  "commonMistakes": [
    "Forgetting edge cases with duplicate values.",
    "Using recursion which causes stack overflow on deep inputs."
  ],
  "learningResources": [
    "LeetCode Pattern Guide",
    "NeetCode 150"
  ]
}
`;

const buildCodingPlatformResult = (problemStatement) => ({
  source: 'local',
  language: 'javascript',
  problemStatement,
  isOptimal: null,
  hasSyntaxErrors: false,
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

/**
 * Executes a chat completion request to Groq with automatic fallback to secondary models.
 */
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
          max_tokens: 2048,
          top_p: 0.8,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        console.warn(`Model ${modelName} returned ${response.status}: ${text.slice(0, 150)}`);
        lastError = new Error(`Groq ${modelName} status ${response.status}`);
        continue; // Try next candidate model
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

export const analyzeSnippetCode = async (req, res) => {
  try {
    const {
      code = '',
      language = 'javascript',
      snippetId,
      versionNumber,
      problemStatement = '',
      codingPlatformMode = false,
      forceRefresh = false,
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

    // Check snippet access if MongoDB is connected and snippetId is provided
    if (activeSnippetId && mongoose.connection?.readyState === 1) {
      try {
        const Snippet = (await import('../models/Snippet.js')).default;
        const snippet = await Snippet.findById(activeSnippetId).lean();
        if (snippet && !snippet.isPublic && snippet.owner.toString() !== req.user.id) {
          return res.status(403).json({ message: 'You can only analyze your own private snippets.' });
        }
      } catch (_e) {
        // Continue if snippet lookup fails
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

      if (!forceRefresh && activeSnippetId && mongoose.connection?.readyState === 1) {
        const cached = await Analysis.findOne({
          snippetId: activeSnippetId,
          versionNumber: normalizedVersion,
          problemStatement: { $exists: true, $ne: '' },
        }).lean();

        if (cached && cached.source === 'groq' && cached.isOptimal !== null) {
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
            groqEnabled: true,
            groqError: '',
            category: 'DSA',
            isDSA: true,
          });
        }
      }

      if (!process.env.GROQ_API_KEY) {
        return res.json({
          ...buildCodingPlatformResult(problemStatement),
          groqEnabled: false,
          groqError: 'AI service is temporarily unavailable. Please provide GROQ_API_KEY to enable mentor analysis.',
        });
      }

      try {
        const { parsed } = await callGroqAPI([
          {
            role: 'system',
            content: 'You are a strict algorithmic mentor and compiler diagnostics engine. Output strictly valid JSON with no markdown wrapping.',
          },
          {
            role: 'user',
            content: promptForCodingPlatform(normalizedCode, language, problemStatement),
          },
        ]);

        const result = {
          source: 'groq',
          language,
          problemStatement,
          isOptimal: parsed.isOptimal ?? false,
          hasSyntaxErrors: parsed.hasSyntaxErrors ?? false,
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

        if (activeSnippetId && mongoose.connection?.readyState === 1) {
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
      } catch (err) {
        console.warn('Groq coding-platform analysis unavailable, using fallback:', err.message);
        return res.json({
          ...buildCodingPlatformResult(problemStatement),
          groqEnabled: true,
          groqError: 'AI service is temporarily unavailable. Showing local mentor feedback instead.',
        });
      }
    }

    // --- Standard Code Review Mode ---
    // Check cache only if not forcing refresh, snippetId exists, and previous analysis was successful Groq analysis
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
          hasSyntaxErrors: Boolean(cached.hasSyntaxErrors) || (cached.issues || []).some((i) => i.severity === 'Critical'),
          errorLines: cached.errorLines || extractErrorLinesFromIssues(cached.issues),
          timeComplexity: cached.complexity?.timeComplexity || cached.timeComplexity || '',
          spaceComplexity: cached.complexity?.spaceComplexity || cached.spaceComplexity || '',
          algorithm: cached.complexity?.algorithm || cached.algorithm || '',
          approach: cached.approach || '',
          overallScore: cached.overallScore || 0,
          ratings: cached.ratings || { performance: 0, readability: 0, maintainability: 0, security: 0, scalability: 0 },
        });
      }
    }

    // Run deterministic static syntax pre-check
    const staticIssues = detectStaticSyntaxErrors(normalizedCode, language);

    if (!process.env.GROQ_API_KEY) {
      markRequest(req.user.id);
      const localResult = {
        ...buildFallbackAnalysis(normalizedCode, language),
        source: 'local',
        groqEnabled: false,
        groqError: 'AI service is temporarily unavailable. Showing cached/local analysis instead.',
      };
      return res.json(localResult);
    }

    try {
      markRequest(req.user.id);
      const { parsed } = await callGroqAPI([
        {
          role: 'system',
          content: 'You are a strict compiler diagnostics and code analysis engine. Return JSON only and nothing else. Output strictly valid JSON without markdown wrapping.',
        },
        {
          role: 'user',
          content: promptForGroq(normalizedCode, language),
        },
      ]);

      const rawIssues = Array.isArray(parsed.issues) ? parsed.issues : [];
      // Merge AI issues with any critical static issues detected
      const combinedIssuesMap = new Map();
      staticIssues.forEach((iss) => {
        combinedIssuesMap.set(`${iss.line}-${iss.title}`, iss);
      });
      rawIssues.forEach((iss) => {
        const line = Number.isFinite(Number(iss.line)) && Number(iss.line) > 0 ? Number(iss.line) : null;
        const column = Number.isFinite(Number(iss.column)) && Number(iss.column) > 0 ? Number(iss.column) : null;
        const formatted = {
          title: iss.title || 'Code Issue',
          severity: ['Low', 'Medium', 'High', 'Critical'].includes(iss.severity) ? iss.severity : 'Medium',
          line,
          column,
          description: iss.description || '',
          fix: iss.fix || '',
        };
        combinedIssuesMap.set(`${line}-${formatted.title}`, formatted);
      });

      const formattedIssues = Array.from(combinedIssuesMap.values());
      const hasSyntaxErrors = Boolean(parsed.hasSyntaxErrors) || formattedIssues.some((i) => i.severity === 'Critical');
      const issueTexts = issuesToText(formattedIssues);
      const errorLineNumbers = extractErrorLinesFromIssues(formattedIssues);

      const fallbackResult = buildFallbackAnalysis(normalizedCode, language);

      const result = {
        source: 'groq',
        groqEnabled: true,
        groqError: '',
        language,
        category: parsed.category || fallbackResult.category || 'Other',
        subCategory: parsed.subCategory || fallbackResult.subCategory || '',
        isDSA: parsed.isDSA ?? fallbackResult.isDSA ?? false,
        hasSyntaxErrors,
        errorLines: errorLineNumbers,
        overallScore: Number.isFinite(Number(parsed.overallScore))
          ? Number(parsed.overallScore)
          : (hasSyntaxErrors ? 3 : fallbackResult.overallScore),
        ratings: parsed.ratings || fallbackResult.ratings,
        algorithm: parsed.algorithm || fallbackResult.algorithm || '',
        approach: parsed.approach || fallbackResult.approach || '',
        timeComplexity: parsed.timeComplexity || fallbackResult.timeComplexity || '',
        spaceComplexity: parsed.spaceComplexity || fallbackResult.spaceComplexity || '',
        dataStructureRecommendations: parsed.dataStructureRecommendations || '',
        explanation: parsed.explanation || fallbackResult.explanation,
        summary: parsed.summary || fallbackResult.summary || '',
        issues: formattedIssues,
        analysisErrors: issueTexts,
        errors: issueTexts,
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

      if (activeSnippetId && mongoose.connection?.readyState === 1) {
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

      return res.json(result);
    } catch (error) {
      console.warn('Groq analysis error, using static fallback:', error.message);
      return res.json({
        ...buildFallbackAnalysis(normalizedCode, language),
        source: 'local',
        groqEnabled: true,
        groqError: 'AI service is temporarily unavailable. Showing local syntax analysis instead.',
      });
    }
  } catch (error) {
    console.error('Fatal analysis error:', error.message);
    return res.status(500).json({
      message: 'Failed to process code analysis: ' + error.message,
    });
  }
};
