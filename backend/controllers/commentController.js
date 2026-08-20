import Comment from '../models/Comment.js';
import Snippet from '../models/Snippet.js';

// Returns all comments for a snippet. Private snippets are only accessible
// to their owner (mirrors the access rule used by getSnippet).
export const getComments = async (req, res) => {
  try {
    const snippet = await Snippet.findById(req.params.snippetId).lean();
    if (!snippet) {
      return res.status(404).json({ message: 'Snippet not found' });
    }
    if (!snippet.isPublic && snippet.owner.toString() !== req.user?.id) {
      return res.status(404).json({ message: 'Snippet not found' });
    }

    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const skip = (page - 1) * limit;

    const [comments, total] = await Promise.all([
      Comment.find({ snippetId: req.params.snippetId })
        .populate('userId', 'name avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Comment.countDocuments({ snippetId: req.params.snippetId }),
    ]);

    const formattedComments = comments.map((c) => {
      const doc = c.toObject ? c.toObject() : c;
      const author = doc.userId || {};
      return {
        ...doc,
        author,
        content: doc.text || doc.content || '',
      };
    });

    return res.json({
      comments: formattedComments,
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

// Adds a comment to a snippet. Private snippets only accept comments from
// their owner (mirrors the access rule used by getSnippet).
export const addComment = async (req, res) => {
  try {
    const snippet = await Snippet.findById(req.params.snippetId);
    if (!snippet) {
      return res.status(404).json({ message: 'Snippet not found' });
    }
    if (!snippet.isPublic && snippet.owner.toString() !== req.user.id) {
      return res.status(404).json({ message: 'Snippet not found' });
    }

    const text = (req.body.text || req.body.content || '').trim();
    if (!text) {
      return res.status(400).json({ message: 'Comment text is required' });
    }
    if (text.length > 2000) {
      return res.status(400).json({ message: 'Comment must be at most 2000 characters' });
    }

    const comment = await Comment.create({
      snippetId: snippet._id,
      userId: req.user.id,
      text,
    });

    const populated = await Comment.findById(comment._id).populate('userId', 'name avatar').lean();
    const formatted = {
      ...populated,
      author: populated.userId || {},
      content: populated.text || '',
    };
    return res.status(201).json({ comment: formatted });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

// Deletes a comment (only the author can delete their own comment).
export const deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }
    if (comment.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You can only delete your own comments' });
    }

    await comment.deleteOne();
    return res.json({ message: 'Comment deleted' });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};