import { DateTime } from 'luxon';
import { prisma } from '@/lib/prisma';
import { ApiError } from '@/lib/httpErrors';
import { decodeCustomerQrValue } from '@/lib/customerQr';
import { auditLog } from '@/lib/auditLog';

const DEDUPE_WINDOW_SECONDS = 30;

export type AwardPointsInput = {
  shopId: string;
  staffUserId: string;
  customerQrValue: string;
  points: number;
};

type AwardPointsCoreInput = {
  shopId: string;
  staffUserId: string;
  customerId: string;
  points: number;
};

export type AwardPointsResult = {
  transaction: { id: string; pointsAwarded: number; createdAt: string };
  membership: { customerId: string; pointsBalance: number };
};

function toShopLocalDateString(utcDate: Date, timezone: string): string {
  return DateTime.fromJSDate(utcDate, { zone: 'utc' }).setZone(timezone).toISODate() ?? '1970-01-01';
}

type ShopConfig = {
  id: string;
  timezone: string;
  defaultAwardPoints: number;
  awardPresets: number[];
  dailyAwardLimitPerCustomer: number;
};

type TxSummary = { id: string; createdAt: Date };

export type AwardPointsDeps = {
  getShop(shopId: string): Promise<ShopConfig | null>;
  findRecentTransaction(input: {
    shopId: string;
    staffUserId: string;
    customerId: string;
    points: number;
    createdAfter: Date;
  }): Promise<TxSummary | null>;
  countAwardsToday(input: { shopId: string; customerId: string; shopLocalDate: string }): Promise<number>;
  getMembership(input: { shopId: string; customerId: string }): Promise<{ customerId: string; pointsBalance: number } | null>;
  upsertMembershipIncrement(input: {
    shopId: string;
    customerId: string;
    incrementBy: number;
  }): Promise<{ customerId: string; pointsBalance: number }>;
  createTransaction(input: {
    shopId: string;
    staffUserId: string;
    customerId: string;
    points: number;
    shopLocalDate: string;
  }): Promise<{ id: string; pointsAwarded: number; createdAt: Date }>;
  audit(event:
    | {
        type: 'award_success';
        shopId: string;
        staffUserId: string;
        customerId: string;
        points: number;
        transactionId: string;
      }
    | {
        type: 'award_deduped';
        shopId: string;
        staffUserId: string;
        customerId: string;
        points: number;
        transactionId: string;
      }): void;
};

export async function awardPointsCore(
  deps: AwardPointsDeps,
  input: AwardPointsCoreInput,
  now: Date,
): Promise<AwardPointsResult> {
  if (!Number.isInteger(input.points) || input.points <= 0) {
    throw new ApiError(400, 'BAD_REQUEST', 'points must be a positive integer');
  }

  const shop = await deps.getShop(input.shopId);
  if (!shop) {
    throw new ApiError(404, 'NOT_FOUND', 'Shop not found');
  }

  const allowedPoints = new Set<number>([shop.defaultAwardPoints, ...shop.awardPresets]);
  if (!allowedPoints.has(input.points)) {
    throw new ApiError(400, 'BAD_REQUEST', 'Invalid points preset');
  }

  const createdAfter = DateTime.fromJSDate(now, { zone: 'utc' })
    .minus({ seconds: DEDUPE_WINDOW_SECONDS })
    .toJSDate();

  const existing = await deps.findRecentTransaction({
    shopId: input.shopId,
    staffUserId: input.staffUserId,
    customerId: input.customerId,
    points: input.points,
    createdAfter,
  });

  if (existing) {
    const membership = await deps.getMembership({ shopId: input.shopId, customerId: input.customerId });
    if (!membership) {
      throw new ApiError(404, 'NOT_FOUND', 'Membership not found');
    }

    deps.audit({
      type: 'award_deduped',
      shopId: input.shopId,
      staffUserId: input.staffUserId,
      customerId: input.customerId,
      points: input.points,
      transactionId: existing.id,
    });

    return {
      transaction: {
        id: existing.id,
        pointsAwarded: input.points,
        createdAt: existing.createdAt.toISOString(),
      },
      membership: {
        customerId: membership.customerId,
        pointsBalance: membership.pointsBalance,
      },
    };
  }

  const shopLocalDate = toShopLocalDateString(now, shop.timezone);
  const successfulAwardsToday = await deps.countAwardsToday({
    shopId: input.shopId,
    customerId: input.customerId,
    shopLocalDate,
  });

  if (successfulAwardsToday >= shop.dailyAwardLimitPerCustomer) {
    throw new ApiError(400, 'DAILY_LIMIT_REACHED', 'Customer reached daily award limit');
  }

  const membership = await deps.upsertMembershipIncrement({
    shopId: input.shopId,
    customerId: input.customerId,
    incrementBy: input.points,
  });

  const transaction = await deps.createTransaction({
    shopId: input.shopId,
    staffUserId: input.staffUserId,
    customerId: input.customerId,
    points: input.points,
    shopLocalDate,
  });

  deps.audit({
    type: 'award_success',
    shopId: input.shopId,
    staffUserId: input.staffUserId,
    customerId: input.customerId,
    points: input.points,
    transactionId: transaction.id,
  });

  return {
    transaction: {
      id: transaction.id,
      pointsAwarded: transaction.pointsAwarded,
      createdAt: transaction.createdAt.toISOString(),
    },
    membership: {
      customerId: membership.customerId,
      pointsBalance: membership.pointsBalance,
    },
  };
}

export async function awardPoints(input: AwardPointsInput): Promise<AwardPointsResult> {
  const decoded = decodeCustomerQrValue(input.customerQrValue);
  if (decoded.shopId !== input.shopId) {
    throw new ApiError(400, 'INVALID_CUSTOMER_QR', 'QR is invalid or unreadable');
  }

  const now = new Date();

  return prisma.$transaction(async (tx) => {
    const deps: AwardPointsDeps = {
      getShop: async (shopId) =>
        tx.shop.findUnique({
          where: { id: shopId },
          select: {
            id: true,
            timezone: true,
            defaultAwardPoints: true,
            awardPresets: true,
            dailyAwardLimitPerCustomer: true,
          },
        }),
      findRecentTransaction: async (i) =>
        tx.pointTransaction.findFirst({
          where: {
            shopId: i.shopId,
            staffUserId: i.staffUserId,
            customerId: i.customerId,
            pointsAwarded: i.points,
            status: 'success',
            createdAt: { gte: i.createdAfter },
          },
          orderBy: { createdAt: 'desc' },
          select: { id: true, createdAt: true },
        }),
      countAwardsToday: async (i) =>
        tx.pointTransaction.count({
          where: {
            shopId: i.shopId,
            customerId: i.customerId,
            status: 'success',
            shopLocalDate: i.shopLocalDate,
          },
        }),
      getMembership: async (i) =>
        tx.membership.findUnique({
          where: { shopId_customerId: { shopId: i.shopId, customerId: i.customerId } },
          select: { customerId: true, pointsBalance: true },
        }),
      upsertMembershipIncrement: async (i) =>
        tx.membership.upsert({
          where: { shopId_customerId: { shopId: i.shopId, customerId: i.customerId } },
          update: { pointsBalance: { increment: i.incrementBy } },
          create: { shopId: i.shopId, customerId: i.customerId, pointsBalance: i.incrementBy },
          select: { customerId: true, pointsBalance: true },
        }),
      createTransaction: async (i) =>
        tx.pointTransaction.create({
          data: {
            shopId: i.shopId,
            staffUserId: i.staffUserId,
            customerId: i.customerId,
            pointsAwarded: i.points,
            status: 'success',
            shopLocalDate: i.shopLocalDate,
          },
          select: { id: true, pointsAwarded: true, createdAt: true },
        }),
      audit: auditLog,
    };

    return awardPointsCore(
      deps,
      {
        shopId: input.shopId,
        staffUserId: input.staffUserId,
        customerId: decoded.customerId,
        points: input.points,
      },
      now,
    );
  });
}
