import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ApiError, jsonError } from '@/lib/httpErrors';
import { requireMerchantSession } from '@/lib/merchantAuth';

export const runtime = 'nodejs';

export async function GET(request: Request, context: { params: Promise<{ shopId: string }> }) {
  try {
    const { shopId } = await context.params;
    if (!shopId) {
      throw new ApiError(400, 'BAD_REQUEST', 'shopId is required');
    }

    const session = requireMerchantSession(request);
    if (session.shopId !== shopId) {
      throw new ApiError(403, 'FORBIDDEN', 'Wrong shop');
    }

    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
      select: {
        defaultAwardPoints: true,
        awardPresets: true,
        dailyAwardLimitPerCustomer: true,
      },
    });

    if (!shop) {
      throw new ApiError(404, 'NOT_FOUND', 'Shop not found');
    }

    return NextResponse.json({
      defaultAwardPoints: shop.defaultAwardPoints,
      awardPresets: shop.awardPresets,
      dailyAwardLimitPerCustomer: shop.dailyAwardLimitPerCustomer,
    });
  } catch (error) {
    return jsonError(error);
  }
}
