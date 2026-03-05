import jwt from 'jsonwebtoken';
import { jwtConfig } from '../config/jwt';

export interface JwtPayload {
  userId: string;
  email: string;
  role: 'admin' | 'user';
}

/** Sign an access token (short-lived, default 1h) */
export function signAccessToken(payload: JwtPayload): string {
  // expiresIn accepts seconds (number) or ms-style strings like "1h", "7d"
  const expiresInSeconds = parseExpiry(jwtConfig.expiresIn);
  return jwt.sign({ ...payload }, jwtConfig.secret, { expiresIn: expiresInSeconds });
}

/** Sign a refresh token (long-lived, default 7d) */
export function signRefreshToken(payload: JwtPayload): string {
  const expiresInSeconds = parseExpiry(jwtConfig.refreshExpiresIn);
  return jwt.sign({ ...payload }, jwtConfig.secret, { expiresIn: expiresInSeconds });
}

/** Convert string like "1h", "7d", "30m" to seconds */
function parseExpiry(value: string): number {
  const match = value.match(/^(\d+)([smhd])$/);
  if (!match) return 3600; // default 1 hour
  const num = parseInt(match[1], 10);
  switch (match[2]) {
    case 's': return num;
    case 'm': return num * 60;
    case 'h': return num * 3600;
    case 'd': return num * 86400;
    default: return 3600;
  }
}

/** Verify any token and return payload */
export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, jwtConfig.secret) as JwtPayload;
}

