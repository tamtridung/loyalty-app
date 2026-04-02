import { ApiError } from './httpErrors';
import { getBearerToken, signToken, verifyToken } from './tokens';

const CUSTOMER_SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

type CustomerSessionPayload = {
  sub: string;
  iat: number;
  exp: number;
};

function getSecret(): string {
  const secret = process.env.CUSTOMER_SESSION_SECRET;
  if (!secret) {
    throw new Error('CUSTOMER_SESSION_SECRET is not set');
  }
  return secret;
}

export function issueCustomerSessionToken(customerId: string): string {
  const now = Math.floor(Date.now() / 1000);
  const payload: CustomerSessionPayload = {
    sub: customerId,
    iat: now,
    exp: now + CUSTOMER_SESSION_TTL_SECONDS,
  };
  return signToken(payload, getSecret());
}

export function requireCustomerId(request: Request): string {
  const token = getBearerToken(request);
  if (!token) {
    throw new ApiError(401, 'UNAUTHORIZED', 'Missing Authorization bearer token');
  }

  try {
    const payload = verifyToken<CustomerSessionPayload>(token, getSecret());
    return payload.sub;
  } catch {
    throw new ApiError(401, 'UNAUTHORIZED', 'Invalid or expired session token');
  }
}
