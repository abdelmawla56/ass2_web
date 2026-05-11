import { Request, Response, NextFunction } from 'express';
import admin from '../config/firebase-admin.js';
import { User } from '../models/User.js';
import { io } from '../server.js';

export interface AuthRequest extends Request {
  user?: admin.auth.DecodedIdToken;
}

export const verifyToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split('Bearer ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;

    io.emit('pulse_event', `[AUTH]: Token verified for ${decodedToken.uid}`);

    // Silent Registration Logic
    await User.findOneAndUpdate(
      { uid: decodedToken.uid },
      { 
        displayName: decodedToken.name, 
        photoURL: decodedToken.picture,
        lastSeen: new Date()
      },
      { upsert: true, new: true }
    );

    next();
  } catch (error) {
    console.error('Auth Error:', error);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};
