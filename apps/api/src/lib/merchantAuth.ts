import bcrypt from 'bcryptjs';
import { ApiError } from './httpErrors';
import { getBearerToken, signToken, verifyToken } from './tokens';

const MERCHANT_SESSION_TTL_SECONDS = 60 * 60 * 12; // 12 hours

type MerchantSessionPayload = {
  staffUserId: string;
  shopId: string;
  iat: number;
  exp: number;
};

function getSecret(): string {
  const secret = process.env.MERCHANT_SESSION_SECRET;
  if (!secret) {
    throw new Error('MERCHANT_SESSION_SECRET is not set');
  }
  return secret;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}

export function issueMerchantSessionToken(staffUserId: string, shopId: string): string {
  const now = Math.floor(Date.now() / 1000);
  const payload: MerchantSessionPayload = {
    staffUserId,
    shopId,
    iat: now,
    exp: now + MERCHANT_SESSION_TTL_SECONDS,
  };

  return signToken(payload, getSecret());
}

export function requireMerchantSession(request: Request): { staffUserId: string; shopId: string } {
  const token = getBearerToken(request);
  if (!token) {
    throw new ApiError(401, 'UNAUTHORIZED', 'Missing Authorization bearer token');
  }

  try {
    const payload = verifyToken<MerchantSessionPayload>(token, getSecret());
    return { staffUserId: payload.staffUserId, shopId: payload.shopId };
  } catch {
    throw new ApiError(401, 'UNAUTHORIZED', 'Invalid or expired session token');
  }
}
