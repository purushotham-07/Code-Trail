import { OAuth2Client } from 'google-auth-library';
import { upsertGoogleUser } from '../services/authService.js';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ message: 'Missing Google credential' });
    }

    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { name, email, sub: googleId, picture: avatar } = payload;
    const { user, token } = await upsertGoogleUser({ name, email, googleId, avatar });

    return res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      },
    });
  } catch (_error) {
    return res.status(401).json({ message: 'Google authentication failed' });
  }
};

export const getCurrentUser = async (req, res) => {
  return res.json({
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      avatar: req.user.avatar,
      createdAt: req.user.createdAt,
    },
  });
};

export const logout = async (_req, res) => {
  return res.json({ message: 'Logged out' });
};
