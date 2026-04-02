import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jsonError, readJson } from '@/lib/httpErrors';
import { normalizeLoginId } from '@/lib/identifiers';
import { issueCustomerSessionToken } from '@/lib/customerSession';

export const runtime = 'nodejs';

type LoginRequest = {
  loginId: string;
};

export async function POST(request: Request) {
  try {
    const body = await readJson<LoginRequest>(request);
    const { loginId, loginType } = normalizeLoginId(body.loginId);

    const customer = await prisma.customer.upsert({
      where: { loginId },
      update: {},
      create: { loginId, loginType },
      select: { id: true, loginId: true },
    });

    const token = issueCustomerSessionToken(customer.id);
    return NextResponse.json({ customer, session: { token } });
  } catch (error) {
    return jsonError(error);
  }
}
