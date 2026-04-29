import jwt from 'jsonwebtoken';

export interface TokenPayload {
  userId: string;
  role: 'professional' | 'owner' | 'admin';
  type: 'access' | 'refresh';
}

export interface DecodedToken extends TokenPayload {
  iat: number;
  exp: number;
}

const getSecret = (type: 'access' | 'refresh'): string => {
  const secret = type === 'access' 
    ? process.env.JWT_SECRET 
    : process.env.JWT_REFRESH_SECRET;
  
  if (!secret) {
    throw new Error(`${type.toUpperCase()} JWT secret is not defined`);
  }
  return secret;
};

const getExpiry = (type: 'access' | 'refresh'): string => {
  return type === 'access' 
    ? process.env.JWT_EXPIRES_IN || '7d'
    : process.env.JWT_REFRESH_EXPIRES_IN || '30d';
};

export const generateToken = (
  userId: string, 
  role: 'professional' | 'owner' | 'admin',
  type: 'access' | 'refresh' = 'access'
): string => {
  const payload: TokenPayload = { userId, role, type };
  const secret = getSecret(type);
  const expiresIn = getExpiry(type);
  
  return jwt.sign(payload, secret, { expiresIn: expiresIn as jwt.SignOptions['expiresIn'] });
};

export const verifyToken = (token: string, type: 'access' | 'refresh' = 'access'): DecodedToken => {
  const secret = getSecret(type);
  return jwt.verify(token, secret) as DecodedToken;
};

export const generateTokenPair = (
  userId: string, 
  role: 'professional' | 'owner' | 'admin'
): { accessToken: string; refreshToken: string } => {
  return {
    accessToken: generateToken(userId, role, 'access'),
    refreshToken: generateToken(userId, role, 'refresh')
  };
};

export const decodeToken = (token: string): DecodedToken | null => {
  try {
    return jwt.decode(token) as DecodedToken;
  } catch {
    return null;
  }
};
