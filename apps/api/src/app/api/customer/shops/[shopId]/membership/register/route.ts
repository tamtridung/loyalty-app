import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ApiError, jsonError, readJson } from '@/lib/httpErrors';
import { requireCustomerId } from '@/lib/customerSession';

export const runtime = 'nodejs';

type RegisterBody = {
  displayName?: string;
  age?: number | null;
  address?: string;
};

function parseAge(value: unknown): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 150) {
    throw new ApiError(400, 'BAD_REQUEST', 'age must be an integer between 0 and 150');
  }
  return parsed;
}

export async function POST(request: Request, context: { params: Promise<{ shopId: string }> }) {
  try {
    const { shopId } = await context.params;
    if (!shopId) {
      throw new ApiError(400, 'BAD_REQUEST', 'shopId is required');
    }

    const customerId = requireCustomerId(request);
    const body = await readJson<RegisterBody>(request);

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: { loginId: true },
    });
    if (!customer) {
      throw new ApiError(401, 'UNAUTHORIZED', 'Invalid session');
    }

    const age = parseAge(body.age);
    const address = (body.address ?? '').trim();
    const inputDisplayName = (body.displayName ?? '').trim();
    const displayName = inputDisplayName.length > 0 ? inputDisplayName : customer.loginId;

    const membership = await prisma.membership.upsert({
      where: { shopId_customerId: { shopId, customerId } },
      update: {
        displayName,
        age,
        address: address.length > 0 ? address : null,
      },
      create: {
        shopId,
        customerId,
        displayName,
        age,
        address: address.length > 0 ? address : null,
        pointsBalance: 0,
      },
      select: {
        displayName: true,
        age: true,
        address: true,
      },
    });

    return NextResponse.json({
      membership: {
        displayName: membership.displayName ?? '',
        age: membership.age,
        address: membership.address ?? '',
      },
    });
  } catch (error) {
    return jsonError(error);
  }
}
