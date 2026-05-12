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

  // Support for Mock Auth for testing
  if (process.env.USE_MOCK_AUTH === 'true' && token === 'mock-token') {
    const mockUser = {
      uid: 'mock-user-123',
      name: 'Test Ghost',
      picture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ghost',
      email: 'test@ghost.com',
      email_verified: true,
      auth_time: Math.floor(Date.now() / 1000),
      iss: '',
      aud: '',
      exp: Math.floor(Date.now() / 1000) + 3600,
      sub: 'mock-user-123',
      firebase: { identities: {}, sign_in_provider: 'google.com' }
    } as admin.auth.DecodedIdToken;

    req.user = mockUser;
    
    await User.findOneAndUpdate(
      { uid: mockUser.uid },
      { 
        displayName: mockUser.name, 
        photoURL: mockUser.picture,
        lastSeen: new Date()
      },
      { upsert: true, new: true }
    );
    
    return next();
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
