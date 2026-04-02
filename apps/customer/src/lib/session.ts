const CUSTOMER_TOKEN_KEY = 'qrloyalty.customerToken';
const CUSTOMER_LOGIN_ID_KEY = 'qrloyalty.customerLoginId';

export function getCustomerToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(CUSTOMER_TOKEN_KEY);
}

export function setCustomerToken(token: string): void {
  window.localStorage.setItem(CUSTOMER_TOKEN_KEY, token);
}

export function clearCustomerToken(): void {
  window.localStorage.removeItem(CUSTOMER_TOKEN_KEY);
}

export function getCustomerLoginId(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(CUSTOMER_LOGIN_ID_KEY);
}

export function setCustomerLoginId(loginId: string): void {
  window.localStorage.setItem(CUSTOMER_LOGIN_ID_KEY, loginId);
}
