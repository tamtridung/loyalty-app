import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ApiError, jsonError } from '@/lib/httpErrors';

export const runtime = 'nodejs';

function getCustomerBaseUrl(): string {
  const raw = process.env.APP_BASE_URL_CUSTOMER ?? 'http://localhost:3000';
  return raw.endsWith('/') ? raw.slice(0, -1) : raw;
}

export async function GET(_request: Request, context: { params: Promise<{ shopId: string }> }) {
  try {
    const { shopId } = await context.params;
    if (!shopId) {
      throw new ApiError(400, 'BAD_REQUEST', 'shopId is required');
    }

    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
      select: { id: true, name: true, status: true },
    });
    if (!shop || shop.status !== 'active') {
      throw new ApiError(404, 'NOT_FOUND', 'Shop not found');
    }

    const url = `${getCustomerBaseUrl()}/shops/${encodeURIComponent(shopId)}`;

    return NextResponse.json({
      shop: { id: shop.id, name: shop.name },
      url,
    });
  } catch (error) {
    return jsonError(error);
  }
}
