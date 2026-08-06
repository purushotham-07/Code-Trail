import mongoose from 'mongoose';

export const connectDB = async () => {
  // In production, MONGO_URI must always be set in Render env vars.
  // Never fall back to localhost in production — it doesn't exist on Render.
  if (process.env.NODE_ENV === 'production' && !process.env.MONGO_URI) {
    throw new Error(
      'MONGO_URI is not set. Add it in Render → Dashboard → Environment → MONGO_URI ' +
      '(e.g. mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/codetrail)'
    );
  }

  const mongoUri =
    process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/codetrail';

  await mongoose.connect(mongoUri);
};
