import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ApiError, jsonError, readJson } from '@/lib/httpErrors';
import { issueMerchantSessionToken, verifyPassword } from '@/lib/merchantAuth';

export const runtime = 'nodejs';

type LoginRequest = {
  shopId: string;
  usernameOrEmail: string;
  password: string;
};

export async function POST(request: Request) {
  try {
    const body = await readJson<LoginRequest>(request);

    const shopId = body.shopId?.trim();
    const usernameOrEmail = body.usernameOrEmail?.trim();
    const password = body.password ?? '';

    if (!shopId || !usernameOrEmail || !password) {
      throw new ApiError(400, 'BAD_REQUEST', 'shopId, usernameOrEmail, and password are required');
    }

    const staff = await prisma.staffUser.findUnique({
      where: {
        shopId_usernameOrEmail: {
          shopId,
          usernameOrEmail,
        },
      },
      select: { id: true, displayName: true, passwordHash: true, status: true },
    });

    if (!staff || staff.status !== 'active') {
      throw new ApiError(401, 'UNAUTHORIZED', 'Invalid credentials');
    }

    const ok = await verifyPassword(password, staff.passwordHash);
    if (!ok) {
      throw new ApiError(401, 'UNAUTHORIZED', 'Invalid credentials');
    }

    await prisma.staffUser.update({
      where: { id: staff.id },
      data: { lastLoginAt: new Date() },
    });

    const token = issueMerchantSessionToken(staff.id, shopId);
    return NextResponse.json({
      staffUser: { id: staff.id, displayName: staff.displayName ?? '' },
      session: { token },
    });
  } catch (error) {
    return jsonError(error);
  }
}
