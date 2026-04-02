const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001';

type ApiErrorBody = { error?: { code?: string; message?: string } };

async function readOrThrow<T>(res: Response): Promise<T> {
  const data = (await res.json()) as unknown;
  if (!res.ok) {
    throw data;
  }
  return data as T;
}

export type MerchantLoginResponse = {
  staffUser: { id: string; displayName: string };
  session: { token: string };
};

export async function merchantLogin(input: {
  shopId: string;
  usernameOrEmail: string;
  password: string;
}): Promise<MerchantLoginResponse> {
  const res = await fetch(`${API_BASE_URL}/api/merchant/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  });
  return readOrThrow<MerchantLoginResponse>(res);
}

export type AwardConfigResponse = {
  defaultAwardPoints: number;
  awardPresets: number[];
  dailyAwardLimitPerCustomer: number;
};

export async function getAwardConfig(shopId: string, token: string): Promise<AwardConfigResponse> {
  const res = await fetch(`${API_BASE_URL}/api/merchant/shops/${encodeURIComponent(shopId)}/award-config`, {
    method: 'GET',
    headers: { authorization: `Bearer ${token}` },
  });
  return readOrThrow<AwardConfigResponse>(res);
}

export type AwardResponse = {
  transaction: { id: string; pointsAwarded: number; createdAt: string };
  membership: { customerId: string; pointsBalance: number };
};

export async function awardPoints(
  shopId: string,
  token: string,
  body: { customerQrValue: string; points: number },
): Promise<AwardResponse> {
  const res = await fetch(`${API_BASE_URL}/api/merchant/shops/${encodeURIComponent(shopId)}/award`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  return readOrThrow<AwardResponse>(res);
}

export function getErrorMessage(error: unknown, fallback: string): string {
  const maybe = error as ApiErrorBody;
  return maybe?.error?.message ?? fallback;
}

export function getErrorCode(error: unknown): string | undefined {
  const maybe = error as ApiErrorBody;
  return maybe?.error?.code;
}

export type DashboardResponse = {
  range: 'today' | 'yesterday' | 'last_week' | 'last_month';
  metrics: { awardTransactions: number; pointsAwarded: number; uniqueCustomers: number };
};

export async function getDashboard(
  shopId: string,
  token: string,
  range: DashboardResponse['range'],
): Promise<DashboardResponse> {
  const res = await fetch(
    `${API_BASE_URL}/api/merchant/shops/${encodeURIComponent(shopId)}/dashboard?range=${encodeURIComponent(range)}`,
    {
      method: 'GET',
      headers: { authorization: `Bearer ${token}` },
    },
  );
  return readOrThrow<DashboardResponse>(res);
}

