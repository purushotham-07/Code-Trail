import Version from '../models/Version.js';
import { applyDiff } from './diff.js';

// Reconstructs a requested version by using the nearest snapshot and replaying
// stored diffs sequentially until the requested version number is reached.
//
// Strategy:
// 1. Load all versions for the snippet ordered by version number.
// 2. Find the most recent snapshot at or before the target version. Snapshots
//    are stored for version 1 and every 20th version, so most reconstructions
//    only need to replay a small number of diffs.
// 3. Starting from the snapshot's full code, apply each subsequent version's
//    stored diff (in order) until we reach the target version.
// 4. If the target version itself is a snapshot, return its full code directly.
//
// This keeps storage compact (only 5% of versions are full snapshots) while
// guaranteeing any version can be reconstructed in O(k) where k is the number
// of versions since the last snapshot.
export const reconstructVersion = async ({ snippetId, targetVersion }) => {
  const versions = await Version.find({ snippetId }).sort({ versionNumber: 1 }).lean();
  if (!versions.length) {
    return null;
  }

  // Locate the nearest snapshot at or before the target version.
  let snapshot = null;
  for (const version of versions) {
    if (version.versionNumber > targetVersion) break;
    if (version.snapshot) {
      snapshot = version;
    }
  }

  // If the target version is a snapshot, return it directly.
  const exact = versions.find((v) => v.versionNumber === targetVersion);
  if (exact?.snapshot) {
    return exact.fullCode;
  }

  if (!snapshot) {
    return null;
  }

  // Replay diffs from the snapshot forward up to the target version.
  let currentCode = snapshot.fullCode;
  for (const version of versions) {
    if (version.versionNumber <= snapshot.versionNumber) continue;
    if (version.versionNumber > targetVersion) break;
    if (version.diff) {
      currentCode = applyDiff(version.diff, currentCode);
    }
  }

  return currentCode;
};