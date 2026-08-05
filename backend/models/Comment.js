import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
  snippetId: { type: mongoose.Schema.Types.ObjectId, ref: 'Snippet', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true, maxlength: 2000 },
  createdAt: { type: Date, default: Date.now },
});

commentSchema.index({ snippetId: 1, createdAt: -1 });

export default mongoose.models.Comment || mongoose.model('Comment', commentSchema);