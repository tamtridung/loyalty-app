import { DateTime } from 'luxon';
import { prisma } from '@/lib/prisma';
import { ApiError } from '@/lib/httpErrors';

export type DashboardRange = 'today' | 'yesterday' | 'last_week' | 'last_month';

export type DashboardMetrics = {
  awardTransactions: number;
  pointsAwarded: number;
  uniqueCustomers: number;
};

function getRangeWindow(range: DashboardRange, timezone: string): { start: Date; end: Date } {
  const nowLocal = DateTime.now().setZone(timezone);

  if (range === 'today') {
    const startLocal = nowLocal.startOf('day');
    return { start: startLocal.toUTC().toJSDate(), end: nowLocal.toUTC().toJSDate() };
  }

  if (range === 'yesterday') {
    const startLocal = nowLocal.minus({ days: 1 }).startOf('day');
    const endLocal = startLocal.plus({ days: 1 });
    return { start: startLocal.toUTC().toJSDate(), end: endLocal.toUTC().toJSDate() };
  }

  if (range === 'last_week') {
    const startLocal = nowLocal.minus({ days: 7 });
    return { start: startLocal.toUTC().toJSDate(), end: nowLocal.toUTC().toJSDate() };
  }

  const startLocal = nowLocal.minus({ days: 30 });
  return { start: startLocal.toUTC().toJSDate(), end: nowLocal.toUTC().toJSDate() };
}

export async function getDashboardMetrics(input: {
  shopId: string;
  range: DashboardRange;
}): Promise<{ range: DashboardRange; metrics: DashboardMetrics }> {
  const shop = await prisma.shop.findUnique({
    where: { id: input.shopId },
    select: { id: true, timezone: true },
  });
  if (!shop) {
    throw new ApiError(404, 'NOT_FOUND', 'Shop not found');
  }

  const window = getRangeWindow(input.range, shop.timezone);

  const where = {
    shopId: input.shopId,
    status: 'success' as const,
    createdAt: {
      gte: window.start,
      lt: window.end,
    },
  };

  const [awardTransactions, pointsAgg, uniqueGroups] = await Promise.all([
    prisma.pointTransaction.count({ where }),
    prisma.pointTransaction.aggregate({
      where,
      _sum: { pointsAwarded: true },
    }),
    prisma.pointTransaction.groupBy({
      by: ['customerId'],
      where,
    }),
  ]);

  return {
    range: input.range,
    metrics: {
      awardTransactions,
      pointsAwarded: pointsAgg._sum.pointsAwarded ?? 0,
      uniqueCustomers: uniqueGroups.length,
    },
  };
}
