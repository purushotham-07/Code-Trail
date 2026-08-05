import mongoose from 'mongoose';

const likeSchema = new mongoose.Schema({
  snippetId: { type: mongoose.Schema.Types.ObjectId, ref: 'Snippet', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
});

// A user can like a snippet only once.
likeSchema.index({ snippetId: 1, userId: 1 }, { unique: true });

export default mongoose.models.Like || mongoose.model('Like', likeSchema);