import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = 'your-secret-key-here'; // In production, use environment variables

export interface DecodedToken {
  userId: string;
  email: string;
  role: string;
}

export function generateToken(userId: string, email: string, role: string) {
  return jwt.sign(
    { userId, email, role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyToken(token: string): DecodedToken | null {
  try {
    return jwt.verify(token, JWT_SECRET) as DecodedToken;
  } catch (error) {
    return null;
  }
}

export async function authenticateUser(req: NextRequest) {
  const token = req.cookies.get('token')?.value || req.headers.get('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return null;
  }
  
  return verifyToken(token);
}

export function requireAuth(allowedRoles: string[] = []) {
  return async (req: NextRequest) => {
    const user = await authenticateUser(req);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    return user;
  };
}