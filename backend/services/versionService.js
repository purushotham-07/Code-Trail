import Version from '../models/Version.js';
import { diffLines, serializeDiff } from '../utils/diff.js';

// Creates a Version record. When previousCode is provided, computes a real
// line-by-line LCS diff between the previous and new code and stores it as a
// serialized operation list. Snapshots (version 1 and every 20th version) store
// the full code so reconstruction can start from the closest snapshot.
export const createVersionRecord = async ({
  snippetId,
  versionNumber,
  fullCode,
  commitMessage,
  author,
  snapshot,
  previousCode,
}) => {
  let diff = '';

  if (!snapshot) {
    const ops = diffLines(
      previousCode ? previousCode.split('\n') : [],
      fullCode ? fullCode.split('\n') : []
    );
    diff = serializeDiff(ops);
  }

  return Version.create({
  snippetId,
  versionNumber,
  snapshot,

  // Store full code only for snapshots
  fullCode: snapshot ? fullCode : "",

  diff,
  commitMessage,
  author,
});
};