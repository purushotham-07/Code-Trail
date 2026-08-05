import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'development-secret');
    const user = await User.findById(decoded.id).select('name email avatar');
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    req.user = user;
    next();
  } catch (_error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Attaches the user when a valid token exists, but does not reject anonymous requests.
export const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'development-secret');
    req.user = await User.findById(decoded.id).select('name email avatar');
  } catch (_error) {
    // Ignore invalid token for optional auth.
  }
  next();
};