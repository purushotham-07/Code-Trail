// LCS (Longest Common Subsequence) line-by-line diff implementation.
//
// The algorithm walks through two arrays of lines and keeps the longest
// common subsequence of unchanged lines. The resulting alignment is then
// converted into added/deleted/unchanged chunks.
//
// Explanation for interview:
// 1. Build an (n+1) x (m+1) DP matrix where matrix[i][j] holds the length
//    of the LCS of oldLines[i..] and newLines[j..].
//    - If oldLines[i] === newLines[j], we extend the subsequence by 1 and
//      move diagonally: matrix[i][j] = matrix[i+1][j+1] + 1.
//    - Otherwise we carry the best LCS from either dropping one old line
//      or dropping one new line.
// 2. Backtrack from (0,0):
//    - If lines match, mark "unchanged" and advance both.
//    - Else if the LCS length is larger below (i.e. dropping the old line
//      preserves a longer common subsequence), mark it "deleted".
//    - Else mark the new line as "added".
// 3. Flush any remaining old lines as "deleted" and new lines as "added".
//
// The result is a minimal-ish aligned list of operations that can be used
// both for visual highlighting and for reconstruction when replayed against
// the base (old) code state.

export const diffLines = (oldLines, newLines) => {
  const matrix = Array.from({ length: oldLines.length + 1 }, () => Array(newLines.length + 1).fill(0));

  for (let i = oldLines.length - 1; i >= 0; i -= 1) {
    for (let j = newLines.length - 1; j >= 0; j -= 1) {
      if (oldLines[i] === newLines[j]) {
        matrix[i][j] = matrix[i + 1][j + 1] + 1;
      } else {
        matrix[i][j] = Math.max(matrix[i + 1][j], matrix[i][j + 1]);
      }
    }
  }

  const result = [];
  let i = 0;
  let j = 0;

  while (i < oldLines.length && j < newLines.length) {
    if (oldLines[i] === newLines[j]) {
      result.push({ type: 'unchanged', value: oldLines[i] });
      i += 1;
      j += 1;
    } else if (matrix[i + 1][j] >= matrix[i][j + 1]) {
      result.push({ type: 'deleted', value: oldLines[i] });
      i += 1;
    } else {
      result.push({ type: 'added', value: newLines[j] });
      j += 1;
    }
  }

  while (i < oldLines.length) {
    result.push({ type: 'deleted', value: oldLines[i] });
    i += 1;
  }

  while (j < newLines.length) {
    result.push({ type: 'added', value: newLines[j] });
    j += 1;
  }

  return result;
};

// Serialises a diff operations array into a stable string stored in MongoDB.
export const serializeDiff = (ops) => JSON.stringify(ops);

// Parses a stored diff string back into an operations array.
export const parseDiff = (diff) => {
  if (!diff) return [];
  try {
    const parsed = JSON.parse(diff);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_error) {
    return [];
  }
};

// Replays a diff operation list against the base lines.
// "unchanged" consumes the next base line and emits it,
// "deleted" skips the next base line,
// "added" inserts the stored new line.
export const applyDiff = (diff, baseCode) => {
  const baseLines = baseCode ? baseCode.split('\n') : [];
  const ops = parseDiff(diff);
  const out = [];
  let baseIndex = 0;

  for (const op of ops) {
    if (op.type === 'unchanged') {
      out.push(baseLines[baseIndex]);
      baseIndex += 1;
    } else if (op.type === 'deleted') {
      baseIndex += 1;
    } else if (op.type === 'added') {
      out.push(op.value);
    }
  }

  out.push(...baseLines.slice(baseIndex));
  return out.join('\n');
};