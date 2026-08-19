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
  const analysisErrors = validationResult(req);
  if (!analysisErrors.isEmpty()) {
    return analysisErrors.array()[0]?.msg || 'Validation failed';
  }
  return null;
};

export const createSnippet = async (req, res) => {
  try {
    const validationError = getValidationError(req);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const {
      title,
      description = '',
      domain = 'dsa',
      difficulty = 'Medium',
      topic = 'General',
      language,
      tags = [],
      code,
      isPublic = true,
      commitMessage = '',
      problemStatement = '',
      targetTimeComplexity = '',
      targetSpaceComplexity = '',
      testCases = [],
      sqlSchema = '',
      sqlDialect = 'standard',
      polyglotSolutions = {},
    } = req.body;

    const inputError = validateSnippetInput({
      title,
      language,
      code,
    });

    if (inputError) {
      return res.status(400).json({ message: inputError });
    }

    const ownerId =
      req.user?.id ||
      req.user?._id ||
      (await getFallbackOwnerId());

    const snippet = await Snippet.create({
      title: title.trim(),
      description: String(description).slice(0, 2000),
      domain: ['dsa', 'sql'].includes(domain) ? domain : 'dsa',
      difficulty: ['Easy', 'Medium', 'Hard'].includes(difficulty) ? difficulty : 'Medium',
      topic: String(topic || 'General').trim(),
      language: language.trim().toLowerCase(),
      tags: Array.isArray(tags)
        ? tags.map((tag) => String(tag).trim().toLowerCase()).filter(Boolean).slice(0, 20)
        : [],
      owner: ownerId,
      isPublic,
      currentVersion: 1,
      problemStatement: String(problemStatement || '').slice(0, 5000),
      targetTimeComplexity: String(targetTimeComplexity || '').slice(0, 50),
      targetSpaceComplexity: String(targetSpaceComplexity || '').slice(0, 50),
      testCases: Array.isArray(testCases) ? testCases.slice(0, 10) : [],
      sqlSchema: String(sqlSchema || '').slice(0, 8000),
      sqlDialect: ['standard', 'postgresql', 'mysql', 'sqlite'].includes(sqlDialect) ? sqlDialect : 'standard',
      polyglotSolutions: {
        java: String(polyglotSolutions?.java || ''),
        python: String(polyglotSolutions?.python || ''),
        cpp: String(polyglotSolutions?.cpp || ''),
        javascript: String(polyglotSolutions?.javascript || ''),
      },
    });

    await createVersionRecord({
      snippetId: snippet._id,
      versionNumber: 1,
      fullCode: code,
      commitMessage: commitMessage?.trim() || 'Initial version',
      author: ownerId,
      snapshot: true,
    });

    return res.status(201).json({
      success: true,
      snippet,
    });
  } catch (error) {
    console.error('Create snippet error:', error);
    return res.status(500).json({
      message: error.message,
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

    // Reconstruct previous code
    const prevCode = await reconstructVersion({
      snippetId: snippet._id,
      targetVersion: snippet.currentVersion,
    });

    if (req.body.title !== undefined) snippet.title = String(req.body.title).trim() || snippet.title;
    if (req.body.description !== undefined) snippet.description = String(req.body.description).slice(0, 2000);
    if (req.body.domain !== undefined && ['dsa', 'sql'].includes(req.body.domain)) snippet.domain = req.body.domain;
    if (req.body.difficulty !== undefined && ['Easy', 'Medium', 'Hard'].includes(req.body.difficulty)) snippet.difficulty = req.body.difficulty;
    if (req.body.topic !== undefined) snippet.topic = String(req.body.topic).trim() || snippet.topic;
    if (req.body.language !== undefined) snippet.language = String(req.body.language).trim().toLowerCase() || snippet.language;
    if (req.body.tags !== undefined) {
      snippet.tags = Array.isArray(req.body.tags)
        ? req.body.tags.map((tag) => String(tag).trim().toLowerCase()).filter(Boolean).slice(0, 20)
        : snippet.tags;
    }
    if (req.body.isPublic !== undefined) snippet.isPublic = Boolean(req.body.isPublic);
    if (req.body.problemStatement !== undefined) snippet.problemStatement = String(req.body.problemStatement || '').slice(0, 5000);
    if (req.body.targetTimeComplexity !== undefined) snippet.targetTimeComplexity = String(req.body.targetTimeComplexity || '').slice(0, 50);
    if (req.body.targetSpaceComplexity !== undefined) snippet.targetSpaceComplexity = String(req.body.targetSpaceComplexity || '').slice(0, 50);
    if (req.body.testCases !== undefined && Array.isArray(req.body.testCases)) snippet.testCases = req.body.testCases.slice(0, 10);
    if (req.body.sqlSchema !== undefined) snippet.sqlSchema = String(req.body.sqlSchema || '').slice(0, 8000);
    if (req.body.sqlDialect !== undefined && ['standard', 'postgresql', 'mysql', 'sqlite'].includes(req.body.sqlDialect)) snippet.sqlDialect = req.body.sqlDialect;
    if (req.body.polyglotSolutions !== undefined && typeof req.body.polyglotSolutions === 'object') {
      snippet.polyglotSolutions = {
        ...snippet.polyglotSolutions,
        ...req.body.polyglotSolutions,
      };
    }

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

    const filter = { isPublic: true };
    if (req.query.domain && ['dsa', 'sql'].includes(req.query.domain)) {
      filter.domain = req.query.domain;
    }
    if (req.query.difficulty && ['Easy', 'Medium', 'Hard'].includes(req.query.difficulty)) {
      filter.difficulty = req.query.difficulty;
    }
    if (req.query.topic && req.query.topic.trim()) {
      filter.topic = req.query.topic.trim();
    }
    if (req.query.language && req.query.language.trim()) {
      filter.language = req.query.language.trim().toLowerCase();
    }

    const [snippets, total] = await Promise.all([
      Snippet.find(filter).populate('owner', 'name avatar').sort(sort).skip(skip).limit(limit),
      Snippet.countDocuments(filter),
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

    const filter = { owner: req.user.id };
    if (req.query.domain && ['dsa', 'sql'].includes(req.query.domain)) {
      filter.domain = req.query.domain;
    }
    if (req.query.difficulty && ['Easy', 'Medium', 'Hard'].includes(req.query.difficulty)) {
      filter.difficulty = req.query.difficulty;
    }

    const [snippets, total] = await Promise.all([
      Snippet.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(limit),
      Snippet.countDocuments(filter),
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

    const latestCode = await reconstructVersion({
      snippetId: original._id,
      targetVersion: original.currentVersion,
    });

    const forked = await Snippet.create({
      title: `${original.title} (fork)`,
      description: original.description,
      domain: original.domain || 'dsa',
      difficulty: original.difficulty || 'Medium',
      topic: original.topic || 'General',
      language: original.language,
      tags: original.tags,
      owner: req.user.id,
      isPublic: true,
      currentVersion: 1,
      problemStatement: original.problemStatement || '',
      targetTimeComplexity: original.targetTimeComplexity || '',
      targetSpaceComplexity: original.targetSpaceComplexity || '',
      testCases: original.testCases || [],
      sqlSchema: original.sqlSchema || '',
      sqlDialect: original.sqlDialect || 'standard',
      polyglotSolutions: original.polyglotSolutions || {},
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

    original.forkCount = (original.forkCount || 0) + 1;
    await original.save();

    return res.status(201).json({ snippet: forked });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

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
