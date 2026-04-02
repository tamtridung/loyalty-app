import { ApiError } from './httpErrors';
import { signToken, verifyToken } from './tokens';

type CustomerQrPayload = {
  v: 1;
  shopId: string;
  customerId: string;
  iat: number;
};

function getSecret(): string {
  const secret = process.env.CUSTOMER_QR_SECRET;
  if (!secret) {
    throw new Error('CUSTOMER_QR_SECRET is not set');
  }
  return secret;
}

export function encodeCustomerQrValue(shopId: string, customerId: string): string {
  const now = Math.floor(Date.now() / 1000);
  const payload: CustomerQrPayload = { v: 1, shopId, customerId, iat: now };
  return signToken(payload, getSecret());
}

export function decodeCustomerQrValue(value: string): { shopId: string; customerId: string } {
  try {
    const payload = verifyToken<CustomerQrPayload>(value, getSecret());
    if (payload.v !== 1 || typeof payload.shopId !== 'string' || typeof payload.customerId !== 'string') {
      throw new Error('Invalid payload');
    }
    return { shopId: payload.shopId, customerId: payload.customerId };
  } catch {
    throw new ApiError(400, 'INVALID_CUSTOMER_QR', 'QR is invalid or unreadable');
  }
}
