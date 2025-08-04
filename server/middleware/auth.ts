import { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../firebase-admin';
import { storage } from '../storage';

export interface AuthRequest extends Request {
  userId?: string;
  userEmail?: string;
}

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No authorization token provided' });
  }

  const idToken = authHeader.substring(7);

  try {
    // Verify the Firebase ID token
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    
    // Add user info to request
    req.userId = decodedToken.uid;
    req.userEmail = decodedToken.email || undefined;

    // Ensure user exists in our database
    const user = await storage.getUser(decodedToken.uid);
    if (!user) {
      // Create user if they don't exist
      await storage.createUser({
        id: decodedToken.uid,
        email: decodedToken.email!,
        displayName: decodedToken.name || null,
        photoURL: decodedToken.picture || null,
      });
    } else {
      // Update last login
      await storage.updateUserLastLogin(decodedToken.uid);
    }

    next();
  } catch (error) {
    console.error('Error verifying Firebase ID token:', error);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

// Optional auth middleware - doesn't require auth but adds user info if available
export async function optionalAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const idToken = authHeader.substring(7);

  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    req.userId = decodedToken.uid;
    req.userEmail = decodedToken.email || undefined;
  } catch (error) {
    // Ignore error and continue without auth
  }

  next();
}