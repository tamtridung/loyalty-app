import { describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/lib/httpErrors';
import type { AwardPointsDeps } from '@/services/awardPoints';
import { awardPointsCore } from '@/services/awardPoints';

function makeDeps(overrides?: Partial<AwardPointsDeps>): AwardPointsDeps {
  const deps: AwardPointsDeps = {
    getShop: async (shopId) => ({
      id: shopId,
      timezone: 'Asia/Ho_Chi_Minh',
      defaultAwardPoints: 1,
      awardPresets: [2, 3],
      dailyAwardLimitPerCustomer: 3,
    }),
    findRecentTransaction: async () => null,
    countAwardsToday: async () => 0,
    getMembership: async ({ customerId }) => ({ customerId, pointsBalance: 10 }),
    upsertMembershipIncrement: async ({ customerId, incrementBy }) => ({
      customerId,
      pointsBalance: 10 + incrementBy,
    }),
    createTransaction: async ({ points }) => ({
      id: 'tx_new',
      pointsAwarded: points,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    }),
    audit: () => {},
  };

  return { ...deps, ...overrides };
}

describe('awardPointsCore', () => {
  it('rejects points not in allowed presets', async () => {
    const deps = makeDeps();

    await expect(
      awardPointsCore(
        deps,
        { shopId: 's1', staffUserId: 'u1', customerId: 'c1', points: 5 },
        new Date('2026-01-01T00:00:00.000Z'),
      ),
    ).rejects.toMatchObject({
      status: 400,
      code: 'BAD_REQUEST',
    } satisfies Partial<ApiError>);
  });

  it('enforces daily award limit', async () => {
    const deps = makeDeps({
      countAwardsToday: async () => 3,
      createTransaction: vi.fn(async ({ points }) => ({
        id: 'tx_should_not_happen',
        pointsAwarded: points,
        createdAt: new Date(),
      })),
    });

    await expect(
      awardPointsCore(
        deps,
        { shopId: 's1', staffUserId: 'u1', customerId: 'c1', points: 1 },
        new Date('2026-01-01T00:00:00.000Z'),
      ),
    ).rejects.toMatchObject({
      status: 400,
      code: 'DAILY_LIMIT_REACHED',
    } satisfies Partial<ApiError>);

    expect(deps.createTransaction).not.toHaveBeenCalled();
  });

  it('dedupes within window and returns existing transaction', async () => {
    const deps = makeDeps({
      findRecentTransaction: async () => ({
        id: 'tx_existing',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      }),
      upsertMembershipIncrement: vi.fn(async ({ customerId, incrementBy }) => ({
        customerId,
        pointsBalance: 10 + incrementBy,
      })),
      createTransaction: vi.fn(async ({ points }) => ({
        id: 'tx_new',
        pointsAwarded: points,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      })),
      audit: vi.fn(),
    });

    const res = await awardPointsCore(
      deps,
      { shopId: 's1', staffUserId: 'u1', customerId: 'c1', points: 2 },
      new Date('2026-01-01T00:00:10.000Z'),
    );

    expect(res.transaction.id).toBe('tx_existing');
    expect(deps.upsertMembershipIncrement).not.toHaveBeenCalled();
    expect(deps.createTransaction).not.toHaveBeenCalled();
    expect(deps.audit).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'award_deduped', transactionId: 'tx_existing' }),
    );
  });
});
