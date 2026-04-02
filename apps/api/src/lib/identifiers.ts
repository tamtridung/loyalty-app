import { ApiError } from './httpErrors';

export type LoginType = 'phone' | 'email';

export function normalizeLoginId(raw: string): { loginId: string; loginType: LoginType } {
  const value = raw.trim();
  if (!value) {
    throw new ApiError(400, 'BAD_REQUEST', 'loginId is required');
  }

  if (value.includes('@')) {
    const email = value.toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      throw new ApiError(400, 'BAD_REQUEST', 'Invalid email');
    }
    return { loginId: email, loginType: 'email' };
  }

  const digitsOnly = value.replace(/\D+/g, '');
  if (digitsOnly.length < 8) {
    throw new ApiError(400, 'BAD_REQUEST', 'Invalid phone number');
  }

  return { loginId: digitsOnly, loginType: 'phone' };
}
