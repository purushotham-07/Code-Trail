import Snippet from '../models/Snippet.js';
import Version from '../models/Version.js';
import { reconstructVersion } from '../utils/reconstructVersion.js';

export const getVersionHistory = async (req, res) => {
  try {
    const snippet = await Snippet.findById(req.params.snippetId).lean();
    if (!snippet) return res.status(404).json({ message: 'Snippet not found' });

    const versions = await Version.find({ snippetId: req.params.snippetId })
      .sort({ versionNumber: 1 })
      .populate('author', 'name avatar')
      .select('versionNumber snapshot commitMessage author createdAt id fullCode diff');
    return res.json({ versions });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

export const getVersionByNumber = async (req, res) => {
  try {
    const snippet = await Snippet.findById(req.params.snippetId);
    if (!snippet) return res.status(404).json({ message: 'Snippet not found' });

    const versionNumber = parseInt(req.params.versionNumber, 10);
    if (!Number.isInteger(versionNumber) || versionNumber < 1) {
      return res.status(400).json({ message: 'Invalid version number' });
    }

    const version = await Version.findOne({
      snippetId: req.params.snippetId,
      versionNumber,
    }).populate('author', 'name avatar');

    if (!version) return res.status(404).json({ message: 'Version not found' });

    // If this is not a stored snapshot, reconstruct the code by replaying diffs.
    if (!version.snapshot) {
      const code = await reconstructVersion({ snippetId: snippet._id, targetVersion: versionNumber });
      const versionObject = version.toObject();
      versionObject.fullCode = code || '';
      versionObject.reconstructed = true;
      return res.json({ version: versionObject });
    }

    return res.json({ version });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

export const compareVersions = async (req, res) => {
  try {
    const baseNum = parseInt(req.params.baseVersion, 10);
    const compareNum = parseInt(req.params.compareVersion, 10);

    if (!Number.isInteger(baseNum) || !Number.isInteger(compareNum) || baseNum < 1 || compareNum < 1) {
      return res.status(400).json({ message: 'Invalid version numbers' });
    }

    const [baseCode, comparedCode] = await Promise.all([
      reconstructVersion({ snippetId: req.params.snippetId, targetVersion: baseNum }),
      reconstructVersion({ snippetId: req.params.snippetId, targetVersion: compareNum }),
    ]);

    return res.json({
      baseCode,
      comparedCode,
      baseVersion: baseNum,
      compareVersion: compareNum,
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};