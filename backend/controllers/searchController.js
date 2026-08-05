import Snippet from '../models/Snippet.js';

export const searchPublicSnippets = async (req, res) => {
  try {
    const { q, language, tag } = req.query;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 12, 1), 50);
    const skip = (page - 1) * limit;

    // Sort options: newest (default), oldest, most forked.
    const sort =
      req.query.sort === 'oldest'
        ? { updatedAt: 1 }
        : req.query.sort === 'forked'
          ? { forkCount: -1, updatedAt: -1 }
          : { updatedAt: -1 };

    const filters = [{ isPublic: true }];
    if (q) filters.push({ $text: { $search: String(q) } });
    if (language) filters.push({ language: String(language).toLowerCase() });
    if (tag) filters.push({ tags: String(tag).toLowerCase() });

    const query = filters.length > 1 ? { $and: filters } : filters[0] || {};

    const [snippets, total] = await Promise.all([
      Snippet.find(query)
        .populate('owner', 'name avatar')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Snippet.countDocuments(query),
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