import { validationResult } from 'express-validator';
import Comment from '../models/Comment.js';
import Like from '../models/Like.js';
import Snippet from '../models/Snippet.js';
import User from '../models/User.js';
import Version from '../models/Version.js';
import { createVersionRecord } from '../services/versionService.js';
import { reconstructVersion } from '../utils/reconstructVersion.js';

const SNAPSHOT_EVERY = 20;

const getFallbackOwnerId = async () => {
  const fallbackEmail = process.env.DEFAULT_SNIPPET_OWNER_EMAIL || 'dev@codetrail.local';
  const fallbackName = process.env.DEFAULT_SNIPPET_OWNER_NAME || 'CodeTrail Dev';
  const fallbackGoogleId = process.env.DEFAULT_SNIPPET_OWNER_GOOGLE_ID || 'codetrail-dev-owner';

  let user = await User.findOne({ email: fallbackEmail }).lean();
  if (!user) {
    user = await User.create({
      name: fallbackName,
      email: fallbackEmail,
      googleId: fallbackGoogleId,
      avatar: '',
    });
  }

  return user._id;
};

// Validates request payload and returns an error message or null.
const validateSnippetInput = ({ title, language, code }) => {
  if (!title || !title.trim()) return 'Title is required';
  if (title.trim().length > 200) return 'Title must be at most 200 characters';
  if (!language || !language.trim()) return 'Language is required';
  if (!code || !code.trim()) return 'Code is required';
  return null;
};

// Express-validator compatible handler that returns the first validation error.
const getValidationError = (req) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return errors.array()[0]?.msg || 'Validation failed';
  }
  return null;
};

export const createSnippet = async (req, res) => {
  try {
    console.log("===== CREATE SNIPPET =====");
    console.log("BODY:", req.body);
    console.log("USER:", req.user);

    const validationError = getValidationError(req);

    if (validationError) {
      console.log("Validation Error:", validationError);
      return res.status(400).json({ message: validationError });
    }

    const {
      title,
      description = "",
      language,
      tags = [],
      code,
      isPublic = true,
      commitMessage = "",
    } = req.body;

    console.log("Checking input...");

    const inputError = validateSnippetInput({
      title,
      language,
      code,
    });

    if (inputError) {
      console.log("Input Error:", inputError);
      return res.status(400).json({ message: inputError });
    }

    console.log("Creating snippet...");

    const ownerId =
      req.user?.id ||
      req.user?._id ||
      (await getFallbackOwnerId());

    const snippet = await Snippet.create({
      title: title.trim(),
      description: String(description).slice(0, 2000),
      language: language.trim().toLowerCase(),
      tags: Array.isArray(tags)
        ? tags.map(tag => String(tag).trim().toLowerCase()).filter(Boolean)
        : [],
      owner: ownerId,
      isPublic,
      currentVersion: 1,
    });

    console.log("Snippet Created:", snippet._id);

    console.log("Creating Version...");

    await createVersionRecord({
      snippetId: snippet._id,
      versionNumber: 1,
      fullCode: code,
      commitMessage: commitMessage?.trim() || "Initial version",
      author: ownerId,
      snapshot: true,
    });

    console.log("Version Created");

    return res.status(201).json({
      success: true,
      snippet,
    });

  } catch (error) {
    console.error("===== ERROR =====");
    console.error(error);
    console.error(error.stack);

    return res.status(500).json({
      message: error.message,
      stack: error.stack,
    });
  }
};

export const editSnippet = async (req, res) => {
  try {
    const validationError = getValidationError(req);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const snippet = await Snippet.findById(req.params.id);
    if (!snippet || snippet.owner.toString() !== req.user.id) {
      return res.status(404).json({ message: 'Snippet not found' });
    }

    const nextVersion = snippet.currentVersion + 1;
    const code = req.body.code ?? '';

    // Reconstruct the previous code (handles snapshot + diff replay).
    const prevCode = await reconstructVersion({
      snippetId: snippet._id,
      targetVersion: snippet.currentVersion,
    });

    if (req.body.title !== undefined) snippet.title = String(req.body.title).trim() || snippet.title;
    if (req.body.description !== undefined) snippet.description = String(req.body.description).slice(0, 2000);
    if (req.body.language !== undefined) snippet.language = String(req.body.language).trim().toLowerCase() || snippet.language;
    if (req.body.tags !== undefined) {
      snippet.tags = Array.isArray(req.body.tags)
        ? req.body.tags.map((tag) => String(tag).trim().toLowerCase()).filter(Boolean).slice(0, 20)
        : snippet.tags;
    }
    if (req.body.isPublic !== undefined) snippet.isPublic = Boolean(req.body.isPublic);
    snippet.currentVersion = nextVersion;
    snippet.updatedAt = new Date();
    await snippet.save();

    const isSnapshot = nextVersion % SNAPSHOT_EVERY === 0;
    await createVersionRecord({
      snippetId: snippet._id,
      versionNumber: nextVersion,
      fullCode: code,
      previousCode: isSnapshot ? null : prevCode,
      snapshot: isSnapshot,
      commitMessage: req.body.commitMessage?.trim() || `Version ${nextVersion}`,
      author: req.user.id,
    });

    return res.json({ snippet });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

export const deleteSnippet = async (req, res) => {
  try {
    const snippet = await Snippet.findById(req.params.id);
    if (!snippet || snippet.owner.toString() !== req.user.id) {
      return res.status(404).json({ message: 'Snippet not found' });
    }

    // Remove all related records to keep the database clean.
    await Promise.all([
      Version.deleteMany({ snippetId: snippet._id }),
      Comment.deleteMany({ snippetId: snippet._id }),
      Like.deleteMany({ snippetId: snippet._id }),
    ]);
    await snippet.deleteOne();
    return res.json({ message: 'Snippet deleted' });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

export const getSnippet = async (req, res) => {
  try {
    const snippet = await Snippet.findById(req.params.id).populate('owner', 'name avatar');
    if (!snippet) {
      return res.status(404).json({ message: 'Snippet not found' });
    }

    if (!snippet.isPublic && snippet.owner._id.toString() !== req.user?.id) {
      return res.status(403).json({ message: 'Private snippet' });
    }

    // Load like count for convenience on the snippet detail page.
    const likeCount = await Like.countDocuments({ snippetId: snippet._id });

    return res.json({ snippet: { ...snippet.toObject(), likeCount } });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

export const getPublicSnippets = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 12, 1), 50);
    const skip = (page - 1) * limit;
    const sort = req.query.sort === 'oldest' ? { updatedAt: 1 } : req.query.sort === 'forked' ? { forkCount: -1 } : { updatedAt: -1 };

    const [snippets, total] = await Promise.all([
      Snippet.find({ isPublic: true }).populate('owner', 'name avatar').sort(sort).skip(skip).limit(limit),
      Snippet.countDocuments({ isPublic: true }),
    ]);

    return res.json({
      snippets,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

export const getUserSnippets = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 12, 1), 50);
    const skip = (page - 1) * limit;

    const [snippets, total] = await Promise.all([
      Snippet.find({ owner: req.user.id }).sort({ updatedAt: -1 }).skip(skip).limit(limit),
      Snippet.countDocuments({ owner: req.user.id }),
    ]);

    return res.json({
      snippets,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

export const forkSnippet = async (req, res) => {
  try {
    const original = await Snippet.findById(req.params.id).populate('owner', 'name avatar');
    if (!original || !original.isPublic) {
      return res.status(404).json({ message: 'Public snippet not found' });
    }

    // Reconstruct the latest code so the fork starts as a clean version 1.
    const latestCode = await reconstructVersion({
      snippetId: original._id,
      targetVersion: original.currentVersion,
    });

    const forked = await Snippet.create({
      title: `${original.title} (fork)`,
      description: original.description,
      language: original.language,
      tags: original.tags,
      owner: req.user.id,
      isPublic: true,
      currentVersion: 1,
      forkInfo: {
        sourceSnippetId: original._id,
        forkedFrom: original.title,
      },
    });

    await createVersionRecord({
      snippetId: forked._id,
      versionNumber: 1,
      fullCode: latestCode || '',
      snapshot: true,
      commitMessage: 'Forked from original snippet',
      author: req.user.id,
    });

    // Increment the original's fork count.
    original.forkCount = (original.forkCount || 0) + 1;
    await original.save();

    return res.status(201).json({ snippet: forked });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

// Restores an old version by creating a NEW version from its code.
// This preserves the immutable version history — the restore becomes
// version currentVersion + 1 with a commit message noting the restore.
export const restoreVersion = async (req, res) => {
  try {
    const snippet = await Snippet.findById(req.params.id);
    if (!snippet || snippet.owner.toString() !== req.user.id) {
      return res.status(404).json({ message: 'Snippet not found' });
    }

    const versionNumber = parseInt(req.params.versionNumber, 10);
    if (!Number.isInteger(versionNumber) || versionNumber < 1) {
      return res.status(400).json({ message: 'Invalid version number' });
    }

    const version = await Version.findOne({
      snippetId: snippet._id,
      versionNumber,
    });
    if (!version) {
      return res.status(404).json({ message: 'Version not found' });
    }

    const restoredCode = await reconstructVersion({
      snippetId: snippet._id,
      targetVersion: versionNumber,
    });

    const nextVersion = snippet.currentVersion + 1;
    snippet.currentVersion = nextVersion;
    snippet.updatedAt = new Date();
    await snippet.save();

    const isSnapshot = nextVersion % SNAPSHOT_EVERY === 0;
    await createVersionRecord({
      snippetId: snippet._id,
      versionNumber: nextVersion,
      fullCode: restoredCode || '',
      snapshot: isSnapshot,
      commitMessage: `Restored from version ${versionNumber}`,
      author: req.user.id,
    });

    return res.json({ snippet, versionNumber: nextVersion });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};