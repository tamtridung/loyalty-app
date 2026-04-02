const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001';

export type CustomerLoginResponse = {
  customer: { id: string; loginId: string };
  session: { token: string };
};

export async function customerLogin(loginId: string): Promise<CustomerLoginResponse> {
  const res = await fetch(`${API_BASE_URL}/api/customer/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ loginId }),
  });

  if (!res.ok) {
    throw await res.json();
  }
  return (await res.json()) as CustomerLoginResponse;
}

export type CustomerMembershipResponse = {
  shop: { id: string; name: string };
  membership: {
    customerId: string;
    displayName: string;
    pointsBalance: number;
    lastUpdatedAt: string;
  };
  customerQr: { value: string };
};

export async function getMembership(shopId: string, token: string): Promise<CustomerMembershipResponse> {
  const res = await fetch(`${API_BASE_URL}/api/customer/shops/${encodeURIComponent(shopId)}/membership`, {
    method: 'GET',
    headers: { authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw await res.json();
  }
  return (await res.json()) as CustomerMembershipResponse;
}

export async function updateDisplayName(
  shopId: string,
  token: string,
  displayName: string,
): Promise<{ membership: { displayName: string } }> {
  const res = await fetch(
    `${API_BASE_URL}/api/customer/shops/${encodeURIComponent(shopId)}/membership/display-name`,
    {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ displayName }),
    },
  );

  if (!res.ok) {
    throw await res.json();
  }
  return (await res.json()) as { membership: { displayName: string } };
}

