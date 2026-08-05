import User from '../models/User.js';
import { signToken } from '../utils/jwt.js';

export const upsertGoogleUser = async ({ name, email, googleId, avatar }) => {
  const user = await User.findOneAndUpdate(
    { googleId },
    { name, email, avatar },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const token = signToken(user);
  return { user, token };
};
