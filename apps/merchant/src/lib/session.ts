const MERCHANT_TOKEN_KEY = 'qrloyalty.merchantToken';
const MERCHANT_SHOP_ID_KEY = 'qrloyalty.merchantShopId';

export function getMerchantToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(MERCHANT_TOKEN_KEY);
}

export function setMerchantToken(token: string): void {
  window.localStorage.setItem(MERCHANT_TOKEN_KEY, token);
}

export function clearMerchantToken(): void {
  window.localStorage.removeItem(MERCHANT_TOKEN_KEY);
}

export function getMerchantShopId(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(MERCHANT_SHOP_ID_KEY);
}

export function setMerchantShopId(shopId: string): void {
  window.localStorage.setItem(MERCHANT_SHOP_ID_KEY, shopId);
}
