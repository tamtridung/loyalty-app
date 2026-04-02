import { expect, test } from '@playwright/test';

test('merchant login -> award happy path', async ({ page, request }) => {
  const apiBaseUrl = process.env.API_BASE_URL ?? 'http://localhost:3001';
  const shopId = 'demo-shop';

  const loginId = `playwright-${Date.now()}@demo.local`;
  const loginRes = await request.post(`${apiBaseUrl}/api/customer/login`, {
    data: { loginId },
  });
  expect(loginRes.ok()).toBeTruthy();
  const loginJson = (await loginRes.json()) as { session: { token: string } };

  const membershipRes = await request.get(`${apiBaseUrl}/api/customer/shops/${encodeURIComponent(shopId)}/membership`, {
    headers: { authorization: `Bearer ${loginJson.session.token}` },
  });
  expect(membershipRes.ok()).toBeTruthy();
  const membershipJson = (await membershipRes.json()) as { customerQr: { value: string } };

  await page.goto('/login');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.waitForURL('**/scan');

  await page.goto(`/award?qr=${encodeURIComponent(membershipJson.customerQr.value)}`);
  await page.getByRole('button', { name: '+1' }).click();

  await expect(page.getByText('Awarded +1 points')).toBeVisible();
});
