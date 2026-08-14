// LCS (Longest Common Subsequence) line-by-line diff algorithm.
// Computes line additions, deletions, and unchanged segments with accurate 1-based line numbers.

export function diffLines(oldLines, newLines) {
  const matrix = Array.from({ length: oldLines.length + 1 }, () =>
    Array(newLines.length + 1).fill(0)
  );

  for (let i = oldLines.length - 1; i >= 0; i -= 1) {
    for (let j = newLines.length - 1; j >= 0; j -= 1) {
      if (oldLines[i] === newLines[j]) {
        matrix[i][j] = matrix[i + 1][j + 1] + 1;
      } else {
        matrix[i][j] = Math.max(matrix[i + 1][j], matrix[i][j + 1]);
      }
    }
  }

  const rawOps = [];
  let i = 0;
  let j = 0;

  while (i < oldLines.length && j < newLines.length) {
    if (oldLines[i] === newLines[j]) {
      rawOps.push({ type: 'unchanged', value: oldLines[i] });
      i += 1;
      j += 1;
    } else if (matrix[i + 1][j] >= matrix[i][j + 1]) {
      rawOps.push({ type: 'deleted', value: oldLines[i] });
      i += 1;
    } else {
      rawOps.push({ type: 'added', value: newLines[j] });
      j += 1;
    }
  }

  while (i < oldLines.length) {
    rawOps.push({ type: 'deleted', value: oldLines[i] });
    i += 1;
  }

  while (j < newLines.length) {
    rawOps.push({ type: 'added', value: newLines[j] });
    j += 1;
  }

  // Annotate line numbers
  let oldLineNum = 1;
  let newLineNum = 1;

  return rawOps.map((op) => {
    if (op.type === 'unchanged') {
      const line = {
        type: 'unchanged',
        value: op.value,
        oldLineNumber: oldLineNum,
        newLineNumber: newLineNum,
      };
      oldLineNum += 1;
      newLineNum += 1;
      return line;
    }

    if (op.type === 'deleted') {
      const line = {
        type: 'deleted',
        value: op.value,
        oldLineNumber: oldLineNum,
        newLineNumber: null,
      };
      oldLineNum += 1;
      return line;
    }

    // added
    const line = {
      type: 'added',
      value: op.value,
      oldLineNumber: null,
      newLineNumber: newLineNum,
    };
    newLineNum += 1;
    return line;
  });
}

// Builds paired side-by-side rows where adjacent deleted and added chunks
// align directly opposite each other on the same rows, matching VS Code split diff.
export function buildSideBySideDiff(ops) {
  const rows = [];
  let k = 0;

  while (k < ops.length) {
    const current = ops[k];

    if (current.type === 'unchanged') {
      rows.push({
        left: {
          type: 'unchanged',
          value: current.value,
          lineNumber: current.oldLineNumber,
        },
        right: {
          type: 'unchanged',
          value: current.value,
          lineNumber: current.newLineNumber,
        },
      });
      k += 1;
      continue;
    }

    // Collect contiguous block of changes (deletions and additions)
    const deletedGroup = [];
    const addedGroup = [];

    while (k < ops.length && ops[k].type !== 'unchanged') {
      if (ops[k].type === 'deleted') {
        deletedGroup.push(ops[k]);
      } else if (ops[k].type === 'added') {
        addedGroup.push(ops[k]);
      }
      k += 1;
    }

    const maxLines = Math.max(deletedGroup.length, addedGroup.length);
    for (let rowIdx = 0; rowIdx < maxLines; rowIdx += 1) {
      const delOp = deletedGroup[rowIdx];
      const addOp = addedGroup[rowIdx];

      rows.push({
        left: delOp
          ? {
              type: 'deleted',
              value: delOp.value,
              lineNumber: delOp.oldLineNumber,
            }
          : {
              type: 'empty',
              value: '',
              lineNumber: null,
            },
        right: addOp
          ? {
              type: 'added',
              value: addOp.value,
              lineNumber: addOp.newLineNumber,
            }
          : {
              type: 'empty',
              value: '',
              lineNumber: null,
            },
      });
    }
  }

  return rows;
}

// Computes diff statistics (number of additions, deletions, unchanged lines)
export function calculateDiffStats(ops = []) {
  let additions = 0;
  let deletions = 0;
  let unchanged = 0;

  for (const op of ops) {
    if (op.type === 'added') additions += 1;
    else if (op.type === 'deleted') deletions += 1;
    else if (op.type === 'unchanged') unchanged += 1;
  }

  return {
    additions,
    deletions,
    unchanged,
    totalChanges: additions + deletions,
  };
}