import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jsonError, readJson } from '@/lib/httpErrors';
import { normalizeLoginId } from '@/lib/identifiers';
import { issueCustomerSessionToken } from '@/lib/customerSession';

export const runtime = 'nodejs';

type LoginRequest = {
  loginId: string;
  shopId?: string;
};

export async function POST(request: Request) {
  try {
    const body = await readJson<LoginRequest>(request);
    const shopId = (body.shopId ?? '').trim();
    const { loginId, loginType } = normalizeLoginId(body.loginId);

    const customer = await prisma.customer.upsert({
      where: { loginId },
      update: {},
      create: { loginId, loginType },
      select: { id: true, loginId: true },
    });

    let membershipExists = false;
    if (shopId.length > 0) {
      const membership = await prisma.membership.findUnique({
        where: { shopId_customerId: { shopId, customerId: customer.id } },
        select: { id: true },
      });
      membershipExists = membership !== null;
    }

    const token = issueCustomerSessionToken(customer.id);
    return NextResponse.json({ customer, session: { token }, membershipExists });
  } catch (error) {
    return jsonError(error);
  }
}
