import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import { getCollections } from '../config/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'scholarconnect_super_secret_jwt_key_2026_dev';

/**
 * Verifies JWT token from Authorization header (Bearer <token>)
 */
export async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Access denied. No authentication token provided.' 
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Attach decoded user info to request
    req.user = decoded;
    
    // Optionally fetch full user record if valid ObjectId
    try {
      const { users } = getCollections();
      if (decoded.userId && ObjectId.isValid(decoded.userId)) {
        const userDoc = await users.findOne(
          { _id: new ObjectId(decoded.userId) },
          { projection: { passwordHash: 0 } }
        );
        if (userDoc) {
          req.userRecord = userDoc;
        }
      }
    } catch {
      // Continue even if database query fails
    }

    next();
  } catch (err) {
    return res.status(403).json({ 
      success: false, 
      message: 'Invalid or expired authentication token.' 
    });
  }
}

/**
 * Optional token authenticator for public endpoints (like exploring opportunities)
 * Attaches req.user if a valid token is present, but doesn't reject if missing.
 */
export function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
    } catch {
      // Ignore token verification errors for optional auth
    }
  }
  next();
}

/**
 * Role-based authorization guard
 * Ensures user has one of the required roles (e.g., 'teacher', 'student')
 */
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden. This action requires one of the following roles: [${allowedRoles.join(', ')}].`,
      });
    }
    next();
  };
}

export { authenticateToken as authenticate };

