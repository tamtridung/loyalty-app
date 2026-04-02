import { NextResponse } from 'next/server';
import { jsonError, readJson, ApiError } from '@/lib/httpErrors';
import { requireMerchantSession } from '@/lib/merchantAuth';
import { awardPoints } from '@/services/awardPoints';

export const runtime = 'nodejs';

type AwardRequest = {
  customerQrValue: string;
  points: number;
};

export async function POST(request: Request, context: { params: Promise<{ shopId: string }> }) {
  try {
    const { shopId } = await context.params;
    if (!shopId) {
      throw new ApiError(400, 'BAD_REQUEST', 'shopId is required');
    }

    const session = requireMerchantSession(request);
    if (session.shopId !== shopId) {
      throw new ApiError(403, 'FORBIDDEN', 'Wrong shop');
    }

    const body = await readJson<AwardRequest>(request);
    const customerQrValue = body.customerQrValue?.trim();
    if (!customerQrValue) {
      throw new ApiError(400, 'BAD_REQUEST', 'customerQrValue is required');
    }

    const result = await awardPoints({
      shopId,
      staffUserId: session.staffUserId,
      customerQrValue,
      points: body.points,
    });

    return NextResponse.json(result);
  } catch (error) {
    return jsonError(error);
  }
}
