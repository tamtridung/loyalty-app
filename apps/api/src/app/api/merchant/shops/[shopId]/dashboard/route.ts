import { NextResponse } from 'next/server';
import { ApiError, jsonError } from '@/lib/httpErrors';
import { requireMerchantSession } from '@/lib/merchantAuth';
import { auditLog } from '@/lib/auditLog';
import { getDashboardMetrics, type DashboardRange } from '@/services/dashboardMetrics';

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

    const url = new URL(request.url);
    const range = url.searchParams.get('range') as DashboardRange | null;
    if (!range || !['today', 'yesterday', 'last_week', 'last_month'].includes(range)) {
      throw new ApiError(400, 'BAD_REQUEST', 'Invalid range');
    }

    auditLog({ type: 'dashboard_view', shopId, staffUserId: session.staffUserId, range });

    const result = await getDashboardMetrics({ shopId, range });
    return NextResponse.json(result);
  } catch (error) {
    return jsonError(error);
  }
}
