// Frontend helper to reconstruct a stored version's code from its serialised
// diff operations. This is primarily used for the diff viewer when comparing
// two versions the API already reconstructed; it is kept here for symmetry
// with the backend implementation and for offline demos.
//
// Each diff entry is one of:
//   { type: 'unchanged', value }  -> next base line is kept
//   { type: 'deleted', value }    -> next base line is skipped
//   { type: 'added', value }      -> value is inserted
export function parseSerializedDiff(diff) {
  if (!diff) return [];
  try {
    const parsed = JSON.parse(diff);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_error) {
    // Legacy diffs were stored as "old => new" strings — return empty ops.
    return [];
  }
}

export function applySerializedDiff(diff, baseCode) {
  const baseLines = baseCode ? baseCode.split('\n') : [];
  const ops = parseSerializedDiff(diff);
  const output = [];
  let baseIndex = 0;

  for (const op of ops) {
    if (op.type === 'unchanged') {
      output.push(baseLines[baseIndex]);
      baseIndex += 1;
    } else if (op.type === 'deleted') {
      baseIndex += 1;
    } else if (op.type === 'added') {
      output.push(op.value);
    }
  }

  output.push(...baseLines.slice(baseIndex));
  return output.join('\n');
}