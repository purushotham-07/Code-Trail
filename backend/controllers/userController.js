import Snippet from '../models/Snippet.js';
import User from '../models/User.js';

export const getProfileStats = async (req, res) => {
  try {
    const [totalSnippets, totalForks, publicSnippets] = await Promise.all([
      Snippet.countDocuments({ owner: req.user.id }),
      Snippet.countDocuments({ owner: req.user.id, 'forkInfo.sourceSnippetId': { $ne: null } }),
      Snippet.countDocuments({ owner: req.user.id, isPublic: true }),
    ]);

    return res.json({
      stats: {
        totalSnippets,
        totalForks,
        publicSnippets,
      },
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

export const getPublicProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('name email avatar createdAt');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 12, 1), 50);
    const skip = (page - 1) * limit;

    const [snippets, total] = await Promise.all([
      Snippet.find({ owner: user._id, isPublic: true }).sort({ updatedAt: -1 }).skip(skip).limit(limit),
      Snippet.countDocuments({ owner: user._id, isPublic: true }),
    ]);

    return res.json({
      user,
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

export const getPublicProfileStats = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('_id');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const [totalSnippets, totalForks, publicSnippetCount] = await Promise.all([
      Snippet.countDocuments({ owner: user._id }),
      Snippet.countDocuments({ owner: user._id, 'forkInfo.sourceSnippetId': { $ne: null } }),
      Snippet.countDocuments({ owner: user._id, isPublic: true }),
    ]);

    return res.json({
      stats: {
        totalSnippets,
        totalForks,
        publicSnippets: publicSnippetCount,
      },
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

// Returns the user's most recent snippets for the "Recent Activity" feed.
export const getRecentActivity = async (req, res) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 6, 1), 20);
    const snippets = await Snippet.find({ owner: req.user.id })
      .sort({ updatedAt: -1 })
      .limit(limit);

    return res.json({ activity: snippets });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};