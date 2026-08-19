/**
 * Deterministic, Non-LLM Static Syntax & Compiler Diagnostics Engine
 * for Python, Java, C++, JavaScript, and SQL.
 * 
 * Runs 100% locally and instantaneously without any API calls or latency.
 */

export function detectStaticSyntaxErrors(code = '', language = 'python') {
  const issues = [];
  if (!code || typeof code !== 'string') return issues;

  const lang = String(language || 'python').trim().toLowerCase();
  const rawLines = code.split('\n');

  // 1. Universal Bracket & Quote Matching
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

      // Skip escaped quotes
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
              description: `Found closing bracket '${ch}' on line ${lineNum} with no matching opening '${pairs[ch]}'.`,
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
      fix: `Add matching '${unclosed.char === '{' ? '}' : unclosed.char === '(' ? ')' : ']'}' to close the block.`,
    });
  }

  // 2. Python Specific Rules
  if (lang === 'python' || lang === 'py') {
    const blockHeaderRegex = /^\s*(def\s+[a-zA-Z_][a-zA-Z0-9_]*\s*\(.*?\)|if\s+.*|elif\s+.*|else|for\s+.*|while\s+.*|class\s+[a-zA-Z_][a-zA-Z0-9_]*.*|try|except.*|finally|with\s+.*)\s*$/;
    
    rawLines.forEach((lineText, lineIdx) => {
      const lineNum = lineIdx + 1;
      const trimmed = lineText.trim();
      if (!trimmed || trimmed.startsWith('#')) return;

      // Rule: Missing colon in header
      if (blockHeaderRegex.test(trimmed) && !trimmed.endsWith(':')) {
        issues.push({
          title: 'Missing colon (:) at end of header',
          severity: 'Critical',
          line: lineNum,
          column: lineText.length,
          description: `Statement "${trimmed}" must end with a colon (:).`,
          fix: `Add ':' at the end of line ${lineNum}.`,
        });
      }

      // Rule: else if instead of elif in Python
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

      // Rule: Logical operators && or || in Python
      if (/[^&]&&[^&]/.test(lineText) || /[^|]\|\|[^|]/.test(lineText)) {
        issues.push({
          title: "Invalid logical operator ('&&' or '||') in Python",
          severity: 'Critical',
          line: lineNum,
          column: 1,
          description: "Python uses 'and' and 'or' keywords instead of '&&' and '||'.",
          fix: "Replace '&&' with 'and', and '||' with 'or'.",
        });
      }

      // Rule: JS/C++ triple equals === or !==
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

      // Rule: ++ or -- operators in Python
      if (/\b[a-zA-Z_][a-zA-Z0-9_]*\+\+/.test(lineText) || /\+\+[a-zA-Z_][a-zA-Z0-9_]*/.test(lineText)) {
        issues.push({
          title: "Invalid increment operator '++' in Python",
          severity: 'Critical',
          line: lineNum,
          column: 1,
          description: "Python does not support '++'. Use '+=' instead.",
          fix: 'Replace var++ with var += 1.',
        });
      }
      if (/\b[a-zA-Z_][a-zA-Z0-9_]*--/.test(lineText) || /--[a-zA-Z_][a-zA-Z0-9_]*/.test(lineText)) {
        issues.push({
          title: "Invalid decrement operator '--' in Python",
          severity: 'Critical',
          line: lineNum,
          column: 1,
          description: "Python does not support '--'. Use '-=' instead.",
          fix: 'Replace var-- with var -= 1.',
        });
      }

      // Rule: Lowercase boolean / null literals in Python
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

      // Rule: Common keyword typos in Python
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

      // Rule: Missing semicolon on statement lines
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

      // Rule: Python keywords in Java/C++
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

      // Rule: Java/C++ for loop syntax check (using commas instead of semicolons)
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

      // Rule: Python keywords in JS
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

      // Rule: for-loop header semicolons
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
}
