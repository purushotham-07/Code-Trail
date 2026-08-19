import Like from '../models/Like.js';
import Snippet from '../models/Snippet.js';

// Returns like count and whether the current user has liked the snippet.
export const getLikeStatus = async (req, res) => {
  try {
    const snippet = await Snippet.findById(req.params.snippetId).select('_id').lean();
    if (!snippet) {
      return res.status(404).json({ message: 'Snippet not found' });
    }

    const [count, liked] = await Promise.all([
      Like.countDocuments({ snippetId: req.params.snippetId }),
      req.user ? Like.exists({ snippetId: req.params.snippetId, userId: req.user.id }) : Promise.resolve(false),
    ]);

    return res.json({ count, likeCount: count, liked: Boolean(liked) });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

// Likes a snippet (authenticated users only).
export const likeSnippet = async (req, res) => {
  try {
    const snippet = await Snippet.findById(req.params.snippetId);
    if (!snippet) {
      return res.status(404).json({ message: 'Snippet not found' });
    }

    // Upsert keeps the operation idempotent — liking twice is a no-op.
    await Like.updateOne(
      { snippetId: snippet._id, userId: req.user.id },
      { snippetId: snippet._id, userId: req.user.id, createdAt: new Date() },
      { upsert: true }
    );

    const count = await Like.countDocuments({ snippetId: snippet._id });
    return res.json({ count, likeCount: count, liked: true });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

// Removes a like from a snippet.
export const unlikeSnippet = async (req, res) => {
  try {
    const snippet = await Snippet.findById(req.params.snippetId);
    if (!snippet) {
      return res.status(404).json({ message: 'Snippet not found' });
    }

    await Like.deleteOne({ snippetId: snippet._id, userId: req.user.id });
    const count = await Like.countDocuments({ snippetId: snippet._id });
    return res.json({ count, likeCount: count, liked: false });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};