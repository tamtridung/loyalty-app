import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ApiError, jsonError, readJson } from '@/lib/httpErrors';
import { requireCustomerId } from '@/lib/customerSession';

export const runtime = 'nodejs';

type PatchBody = {
  displayName: string;
};

export async function PATCH(request: Request, context: { params: Promise<{ shopId: string }> }) {
  try {
    const { shopId } = await context.params;
    if (!shopId) {
      throw new ApiError(400, 'BAD_REQUEST', 'shopId is required');
    }

    const customerId = requireCustomerId(request);
    const body = await readJson<PatchBody>(request);
    const displayName = (body.displayName ?? '').trim();

    const membership = await prisma.membership.update({
      where: { shopId_customerId: { shopId, customerId } },
      data: { displayName: displayName.length === 0 ? null : displayName },
      select: { displayName: true },
    });

    return NextResponse.json({ membership: { displayName: membership.displayName ?? '' } });
  } catch (error) {
    return jsonError(error);
  }
}
