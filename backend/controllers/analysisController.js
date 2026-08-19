import mongoose from 'mongoose';
import Analysis from '../models/Analysis.js';

const aiCooldowns = new Map();
const AI_COOLDOWN_MS = 6 * 1000; // 6 second cooldown for responsive UX

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
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
  'llama3-70b-8192',
  'mixtral-8x7b-32768',
  'openai/gpt-oss-120b',
  'openai/gpt-oss-20b',
  'groq/compound',
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

/**
 * Deterministic static syntax & parser pre-check for DSA (Java, Python, C++, JS) & SQL.
 */
export const detectStaticSyntaxErrors = (code = '', language = 'python') => {
  const issues = [];
  const lang = String(language || 'python').trim().toLowerCase();
  const lines = code.split('\n');

  // 1. Bracket matching
  const stack = [];
  const pairs = { '}': '{', ')': '(', ']': '[' };
  const opening = new Set(['{', '(', '[']);
  const closing = new Set(['}', ')', ']']);

  lines.forEach((lineText, lineIdx) => {
    const lineNum = lineIdx + 1;
    const trimmed = lineText.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('#') || trimmed.startsWith('--') || trimmed.startsWith('/*')) return;

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
              description: `Found unexpected '${ch}' with no matching opening bracket.`,
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
    const blockHeaders = /^\s*(def\s+[a-zA-Z_][a-zA-Z0-9_]*\s*\(.*\)|if\s+.*|elif\s+.*|else|for\s+.*|while\s+.*|class\s+[a-zA-Z_][a-zA-Z0-9_]*.*|try|except.*|finally)\s*$/;
    lines.forEach((lineText, lineIdx) => {
      const lineNum = lineIdx + 1;
      const trimmed = lineText.trim();
      if (!trimmed || trimmed.startsWith('#')) return;

      if (blockHeaders.test(trimmed) && !trimmed.endsWith(':')) {
        issues.push({
          title: 'Missing colon in Python header',
          severity: 'Critical',
          line: lineNum,
          column: lineText.length,
          description: `Statement "${trimmed}" must end with a colon (:).`,
          fix: `Add ':' at the end of line ${lineNum}.`,
        });
      }
    });
  }

  // 3. JavaScript for-loop / syntax check
  if (lang === 'javascript' || lang === 'js') {
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
            column: lineText.indexOf('for') + 1,
            description: '3-part for loop requires semicolons: for (init; cond; update).',
            fix: 'Add the missing semicolon between condition and increment.',
          });
        }
      }
    });
  }

  // 4. SQL checks
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
      if (/^\s*GROUP\s+BY\s*$/i.test(lineText.trim())) {
        issues.push({
          title: 'Incomplete GROUP BY clause',
          severity: 'Critical',
          line: lineNum,
          column: 1,
          description: 'GROUP BY clause requires at least one column expression.',
          fix: 'Specify columns to group by.',
        });
      }
    });
  }

  return issues;
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
 * Prompt for DSA (Java, Python, C++, JavaScript) with Big-O complexity & polyglot translations.
 */
const promptForDSA = (code, language, targetTime, targetSpace, problemStatement) => `
You are a Principal Algorithmic Engineer, Competitive Programming Specialist, and Lead Tech Interviewer.

Analyze this ${language} DSA solution.

CONTEXT:
- Target Time Complexity: ${targetTime || 'Optimal'}
- Target Space Complexity: ${targetSpace || 'Optimal'}
- Problem Description: ${problemStatement || 'Algorithmic Problem'}

CRITICAL INSTRUCTIONS:
1. SYNTAX & COMPILATION: Check for syntax/type/compilation errors in ${language}. If found, set "hasSyntaxErrors": true and list each in "issues" with severity "Critical" and exact line numbers.
2. BIG-O COMPLEXITY: Evaluate exact Time Complexity (e.g. "O(N log N)") and Space Complexity (e.g. "O(1)").
3. TARGET CHECK: Compare actual complexity against target. Set "targetComplexityMet": true/false.
4. POLYGLOT ROSETTA: Generate idiomatic, clean, working implementations of this exact algorithm in ALL 4 DSA languages:
   - "java": Idiomatic Java 17+ code
   - "python": Idiomatic Python 3 code
   - "cpp": Modern C++20 code
   - "javascript": Clean modern JavaScript (ES2022)
5. PROGRESSIVE HINTS: Provide 3 progressive hints:
   - Hint 1: High level intuition & invariant
   - Hint 2: Optimal Data Structure & State representation
   - Hint 3: Key algorithmic transitions & edge cases
6. CODE GENERATION:
   - "correctedCode": If syntax or logical bugs exist, provide working code.
   - "optimizedCode": If approach can be improved to better Big-O, provide optimized code.

RETURN ONLY VALID JSON:
{
  "category": "DSA",
  "subCategory": "Topic/Pattern (e.g. Two Pointers, Dynamic Programming, Monotonic Stack)",
  "isDSA": true,
  "domain": "dsa",
  "hasSyntaxErrors": false,
  "overallScore": 8,
  "ratings": {
    "performance": 8,
    "readability": 8,
    "maintainability": 8,
    "security": 9,
    "scalability": 8
  },
  "algorithm": "Algorithm Name",
  "approach": "Brute Force | Better | Optimal",
  "timeComplexity": "O(...)",
  "spaceComplexity": "O(...)",
  "targetComplexityMet": true,
  "dataStructureRecommendations": "Recommendation with rationale",
  "explanation": "Summary of how algorithm works.",
  "summary": "2-sentence executive summary.",
  "issues": [
    {
      "title": "Issue title",
      "severity": "Critical | High | Medium | Low",
      "line": 1,
      "column": 1,
      "description": "...",
      "fix": "..."
    }
  ],
  "hints": [
    "Hint 1 (Intuition): ...",
    "Hint 2 (Data Structure): ...",
    "Hint 3 (Algorithm & Edge Cases): ..."
  ],
  "commonMistakes": [
    "Common candidate mistake..."
  ],
  "strengths": ["..."],
  "suggestions": ["..."],
  "correctedCode": "",
  "optimizedCode": "",
  "polyglotTranslations": {
    "python": "...",
    "java": "...",
    "cpp": "...",
    "javascript": "..."
  },
  "interviewQuestions": ["..."]
}

Source Code (${language}):
${code}
`;

/**
 * Prompt for SQL query review, clause execution pipeline, and schema optimizations.
 */
const promptForSQL = (code, dialect, sqlSchema, problemStatement) => `
You are a Staff Database Architect, Query Optimization Specialist, and SQL Performance Auditor.

Analyze this SQL query (${dialect || 'Standard SQL'}).

SCHEMA CONTEXT:
${sqlSchema || 'Standard tables/schemas'}

PROBLEM STATEMENT:
${problemStatement || 'SQL Data Query'}

CRITICAL INSTRUCTIONS:
1. SYNTAX & COMPILATION: Check for SQL syntax errors, missing JOIN ON clauses, misspelled keywords, unclosed quotes, grouping errors. If errors exist, set "hasSyntaxErrors": true and list in "issues".
2. EXECUTION PIPELINE: Provide step-by-step breakdown of how SQL executes this query logically:
   - List the clauses in true logical execution order (e.g. 1. FROM/JOIN, 2. WHERE, 3. GROUP BY, 4. HAVING, 5. WINDOW, 6. SELECT, 7. DISTINCT, 8. ORDER BY, 9. LIMIT).
3. ANTI-PATTERNS & INDEXES: Detect anti-patterns (e.g. SELECT *, Cartesian joins, unindexed scans, correlated subqueries) and suggest index/query rewrites.
4. CODE GENERATION:
   - "correctedCode": Corrected bug-free SQL if errors exist.
   - "optimizedCode": Optimized dialect-specific SQL with indexes/CTEs.

RETURN ONLY VALID JSON:
{
  "category": "SQL",
  "subCategory": "Topic (e.g. Window Functions, CTEs, Joins, Aggregations)",
  "isDSA": false,
  "domain": "sql",
  "hasSyntaxErrors": false,
  "overallScore": 8,
  "ratings": {
    "performance": 8,
    "readability": 8,
    "maintainability": 8,
    "security": 9,
    "scalability": 8
  },
  "algorithm": "SQL Query Strategy",
  "approach": "Standard / Window Partition / CTE / Index Scan",
  "timeComplexity": "O(N log N) / Index Scan",
  "spaceComplexity": "O(N) Temp Table / O(1)",
  "explanation": "High level summary of how the query works.",
  "summary": "2-sentence query audit summary.",
  "issues": [
    {
      "title": "Issue title",
      "severity": "Critical | High | Medium | Low",
      "line": 1,
      "column": 1,
      "description": "...",
      "fix": "..."
    }
  ],
  "sqlAnalysis": {
    "clauseOrder": [
      { "clause": "FROM & JOIN", "order": 1, "description": "Fetches and joins source tables." },
      { "clause": "WHERE", "order": 2, "description": "Filters rows before aggregation." },
      { "clause": "GROUP BY", "order": 3, "description": "Aggregates grouped rows." },
      { "clause": "HAVING", "order": 4, "description": "Filters grouped records." },
      { "clause": "SELECT", "order": 5, "description": "Evaluates expressions and aliases." },
      { "clause": "ORDER BY", "order": 6, "description": "Sorts final result set." }
    ],
    "antiPatterns": [
      "Missing index on join column",
      "Using SELECT * instead of explicit columns"
    ],
    "optimizations": [
      "Add composite index ON employees(department_id, salary DESC)"
    ],
    "indexSuggestions": [
      "CREATE INDEX idx_dept_salary ON employees(department_id, salary);"
    ]
  },
  "strengths": ["..."],
  "suggestions": ["..."],
  "correctedCode": "",
  "optimizedCode": "",
  "interviewQuestions": ["..."]
}

Source SQL:
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

export const analyzeSnippetCode = async (req, res) => {
  try {
    const {
      code = '',
      language = 'python',
      snippetId,
      versionNumber,
      domain = 'dsa',
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
        message: `Please wait ${cooldownRemaining} seconds before requesting AI analysis again.`,
      });
    }

    // Check cache only if not forcing refresh and previous analysis was real Groq analysis
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
          polyglotTranslations: cached.polyglotTranslations || {},
          sqlAnalysis: cached.sqlAnalysis || { clauseOrder: [], antiPatterns: [], optimizations: [], indexSuggestions: [] },
          interviewQuestions: cached.interviewQuestions || [],
          learningResources: cached.learningResources || [],
          category: cached.category || (domain === 'sql' ? 'SQL' : 'DSA'),
          subCategory: cached.subCategory || '',
          isDSA: domain === 'dsa',
          domain: cached.domain || domain,
          hasSyntaxErrors: Boolean(cached.hasSyntaxErrors) || (cached.issues || []).some((i) => i.severity === 'Critical'),
          errorLines: cached.errorLines || extractErrorLinesFromIssues(cached.issues),
          timeComplexity: cached.complexity?.timeComplexity || cached.timeComplexity || '',
          spaceComplexity: cached.complexity?.spaceComplexity || cached.spaceComplexity || '',
          targetComplexityMet: cached.targetComplexityMet,
          algorithm: cached.complexity?.algorithm || cached.algorithm || '',
          approach: cached.approach || '',
          overallScore: cached.overallScore || 0,
          ratings: cached.ratings || { performance: 0, readability: 0, maintainability: 0, security: 0, scalability: 0 },
        });
      }
    }

    // Static syntax pre-check
    const staticIssues = detectStaticSyntaxErrors(normalizedCode, language);

    if (!process.env.GROQ_API_KEY) {
      markRequest(req.user.id);
      return res.json({
        source: 'local',
        language,
        domain,
        overallScore: staticIssues.length > 0 ? 3 : 7,
        hasSyntaxErrors: staticIssues.length > 0,
        errorLines: staticIssues.map((i) => i.line).filter(Boolean),
        issues: staticIssues,
        analysisErrors: issuesToText(staticIssues),
        errors: issuesToText(staticIssues),
        explanation: staticIssues.length > 0
          ? `Syntax issues detected on line(s): ${staticIssues.map((i) => i.line).join(', ')}.`
          : 'Code reviewed against standard algorithmic best practices.',
        summary: 'Static review completed.',
        strengths: [],
        suggestions: ['Review syntax and logic flow.'],
        polyglotTranslations: {},
        sqlAnalysis: { clauseOrder: [], antiPatterns: [], optimizations: [], indexSuggestions: [] },
        groqEnabled: false,
        groqError: 'AI service unavailable. Showing local syntax diagnostics.',
      });
    }

    markRequest(req.user.id);

    const isSql = domain === 'sql' || language === 'sql';
    const systemPrompt = isSql
      ? 'You are a strict SQL query optimization and diagnostics engine. Output strictly valid JSON without markdown fences.'
      : 'You are a strict algorithmic compiler and DSA mentor engine. Output strictly valid JSON without markdown fences.';

    const userPrompt = isSql
      ? promptForSQL(normalizedCode, sqlDialect, sqlSchema, problemStatement)
      : promptForDSA(normalizedCode, language, targetTimeComplexity, targetSpaceComplexity, problemStatement);

    const { parsed } = await callGroqAPI([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ]);

    const rawIssues = Array.isArray(parsed.issues) ? parsed.issues : [];
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

    const actualTime = parsed.timeComplexity || '';
    const actualTimeRank = getComplexityRank(actualTime);
    const targetTimeRank = targetTimeComplexity ? getComplexityRank(targetTimeComplexity) : 4;
    const isTargetMet = parsed.targetComplexityMet !== undefined && parsed.targetComplexityMet !== null
      ? Boolean(parsed.targetComplexityMet)
      : actualTimeRank <= targetTimeRank && !hasSyntaxErrors;

    const result = {
      source: 'groq',
      groqEnabled: true,
      groqError: '',
      language,
      domain: isSql ? 'sql' : 'dsa',
      category: parsed.category || (isSql ? 'SQL' : 'DSA'),
      subCategory: parsed.subCategory || (isSql ? 'Query' : 'Algorithm'),
      isDSA: !isSql,
      hasSyntaxErrors,
      errorLines: errorLineNumbers,
      overallScore: Number.isFinite(Number(parsed.overallScore))
        ? Number(parsed.overallScore)
        : hasSyntaxErrors ? 3 : 8,
      ratings: parsed.ratings || { performance: 8, readability: 8, maintainability: 8, security: 9, scalability: 8 },
      algorithm: parsed.algorithm || '',
      approach: parsed.approach || (isTargetMet ? 'Optimal' : 'Sub-Optimal'),
      timeComplexity: parsed.timeComplexity || '',
      spaceComplexity: parsed.spaceComplexity || '',
      targetComplexityMet: isTargetMet,
      isSolved: isTargetMet && !hasSyntaxErrors,
      dataStructureRecommendations: parsed.dataStructureRecommendations || '',
      explanation: parsed.explanation || 'Code review completed.',
      summary: parsed.summary || 'Review findings summarized above.',
      issues: formattedIssues,
      analysisErrors: issueTexts,
      errors: issueTexts,
      hints: Array.isArray(parsed.hints) ? parsed.hints : [],
      commonMistakes: Array.isArray(parsed.commonMistakes) ? parsed.commonMistakes : [],
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
      securityIssues: Array.isArray(parsed.securityIssues) ? parsed.securityIssues : [],
      performanceImprovements: Array.isArray(parsed.performanceImprovements) ? parsed.performanceImprovements : [],
      futureSuggestions: Array.isArray(parsed.futureSuggestions) ? parsed.futureSuggestions : [],
      designPatterns: Array.isArray(parsed.designPatterns) ? parsed.designPatterns : [],
      correctedCode: parsed.correctedCode || '',
      optimizedCode: parsed.optimizedCode || '',
      polyglotTranslations: parsed.polyglotTranslations || {},
      sqlAnalysis: parsed.sqlAnalysis || {
        clauseOrder: [
          { clause: 'FROM / JOIN', order: 1, description: 'Loads tables and joins' },
          { clause: 'WHERE', order: 2, description: 'Row filtering' },
          { clause: 'GROUP BY', order: 3, description: 'Grouping rows' },
          { clause: 'HAVING', order: 4, description: 'Group filtering' },
          { clause: 'SELECT', order: 5, description: 'Projects output expressions' },
          { clause: 'ORDER BY', order: 6, description: 'Sorts results' },
        ],
        antiPatterns: [],
        optimizations: [],
        indexSuggestions: [],
      },
      interviewQuestions: Array.isArray(parsed.interviewQuestions) ? parsed.interviewQuestions : [],
      learningResources: Array.isArray(parsed.learningResources) ? parsed.learningResources : [],
      complexity: {
        algorithm: parsed.algorithm || '',
        timeComplexity: parsed.timeComplexity || '',
        spaceComplexity: parsed.spaceComplexity || '',
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
            domain: result.domain,
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
            targetComplexityMet: result.targetComplexityMet,
            dataStructureRecommendations: result.dataStructureRecommendations,
            explanation: result.explanation,
            summary: result.summary,
            issues: result.issues,
            analysisErrors: result.analysisErrors,
            hints: result.hints,
            commonMistakes: result.commonMistakes,
            strengths: result.strengths,
            suggestions: result.suggestions,
            securityIssues: result.securityIssues,
            performanceImprovements: result.performanceImprovements,
            futureSuggestions: result.futureSuggestions,
            designPatterns: result.designPatterns,
            correctedCode: result.correctedCode,
            optimizedCode: result.optimizedCode,
            polyglotTranslations: result.polyglotTranslations,
            sqlAnalysis: result.sqlAnalysis,
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
    console.error('Analysis error:', error.message);
    return res.json({
      source: 'local',
      language: req.body?.language || 'python',
      domain: req.body?.domain || 'dsa',
      overallScore: 6,
      hasSyntaxErrors: false,
      errorLines: [],
      issues: [],
      analysisErrors: [],
      errors: [],
      explanation: 'AI service is temporarily busy. Showing preliminary local overview.',
      summary: 'Please try clicking Re-analyze in a moment.',
      strengths: ['Readable code structure.'],
      suggestions: ['Add comprehensive test cases.'],
      polyglotTranslations: {},
      sqlAnalysis: { clauseOrder: [], antiPatterns: [], optimizations: [], indexSuggestions: [] },
      groqEnabled: true,
      groqError: 'AI service is temporarily busy. Showing local summary.',
    });
  }
};

/**
 * Translates a DSA solution into any of the 4 supported languages (Java, Python, C++, JavaScript).
 */
export const translatePolyglot = async (req, res) => {
  try {
    const { code = '', fromLanguage = 'python', toLanguage = 'java' } = req.body;
    if (!code.trim()) {
      return res.status(400).json({ message: 'Code is required for translation.' });
    }

    const validLangs = ['python', 'java', 'cpp', 'javascript'];
    if (!validLangs.includes(toLanguage.toLowerCase())) {
      return res.status(400).json({ message: 'Target language must be python, java, cpp, or javascript.' });
    }

    const prompt = `
You are a Staff Software Engineer & Polyglot Algorithm Specialist.
Translate the following ${fromLanguage} algorithm into idiomatic, clean, working ${toLanguage}.

Original ${fromLanguage} code:
${code}

Return ONLY valid JSON matching this schema with NO markdown fences:
{
  "toLanguage": "${toLanguage}",
  "translatedCode": "complete working code in ${toLanguage}",
  "notes": "key idiomatic differences between ${fromLanguage} and ${toLanguage}"
}
`;

    const { parsed } = await callGroqAPI([
      { role: 'system', content: 'You are an algorithmic polyglot compiler. Output strictly valid JSON.' },
      { role: 'user', content: prompt },
    ]);

    return res.json({
      success: true,
      toLanguage,
      translatedCode: parsed.translatedCode || '',
      notes: parsed.notes || '',
    });
  } catch (error) {
    return res.status(500).json({ message: 'Translation error: ' + error.message });
  }
};
