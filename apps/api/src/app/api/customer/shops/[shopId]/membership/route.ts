import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ApiError, jsonError } from '@/lib/httpErrors';
import { requireCustomerId } from '@/lib/customerSession';
import { encodeCustomerQrValue } from '@/lib/customerQr';

export const runtime = 'nodejs';

export async function GET(request: Request, context: { params: Promise<{ shopId: string }> }) {
  try {
    const { shopId } = await context.params;
    if (!shopId) {
      throw new ApiError(400, 'BAD_REQUEST', 'shopId is required');
    }

    const customerId = requireCustomerId(request);

    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
      select: { id: true, name: true },
    });
    if (!shop) {
      throw new ApiError(404, 'NOT_FOUND', 'Shop not found');
    }

    const membership = await prisma.membership.findUnique({
      where: { shopId_customerId: { shopId, customerId } },
      select: {
        customerId: true,
        displayName: true,
        pointsBalance: true,
        updatedAt: true,
      },
    });
    if (!membership) {
      throw new ApiError(404, 'REGISTRATION_REQUIRED', 'Please complete registration first');
    }

    const customerQrValue = encodeCustomerQrValue(shopId, customerId);

    return NextResponse.json({
      shop,
      membership: {
        customerId: membership.customerId,
        displayName: membership.displayName ?? '',
        pointsBalance: membership.pointsBalance,
        lastUpdatedAt: membership.updatedAt.toISOString(),
      },
      customerQr: { value: customerQrValue },
    });
  } catch (error) {
    return jsonError(error);
  }
}
