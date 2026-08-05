// LCS (Longest Common Subsequence) line-by-line diff used by the diff viewer.
//
// How it works:
// 1. Build a DP matrix where matrix[i][j] is the length of the LCS of
//    oldLines[i..] and newLines[j..].
// 2. Backtrack from (0,0):
//    - Equal lines -> "unchanged", advance both pointers.
//    - Otherwise compare the LCS length of dropping the old line vs the new
//      line, and mark the larger direction as "deleted"/"added".
// 3. Flush remaining lines.
//
// Time complexity: O(n * m) worst case.
export function diffLines(oldLines, newLines) {
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
}