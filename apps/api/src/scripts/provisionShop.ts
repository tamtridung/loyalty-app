import { prisma } from '../lib/prisma';
import { hashPassword } from '../lib/merchantAuth';

type Args = {
  shopId: string;
  shopName: string;
  timezone: string;
  staffLogin: string;
  staffPassword: string;
  staffDisplayName: string;
  defaultAwardPoints: number;
  awardPresets: number[];
  dailyAwardLimitPerCustomer: number;
};

function readArgMap(argv: string[]): Record<string, string> {
  const result: Record<string, string> = {};

  for (const raw of argv) {
    if (!raw.startsWith('--')) continue;
    const trimmed = raw.slice(2);
    const eq = trimmed.indexOf('=');
    if (eq === -1) {
      result[trimmed] = 'true';
      continue;
    }
    const key = trimmed.slice(0, eq);
    const value = trimmed.slice(eq + 1);
    result[key] = value;
  }

  return result;
}

function parseNumber(input: string | undefined, fallback: number): number {
  if (!input) return fallback;
  const value = Number(input);
  return Number.isFinite(value) ? value : fallback;
}

function parseNumberList(input: string | undefined, fallback: number[]): number[] {
  if (!input) return fallback;
  const items = input
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => Number(s))
    .filter((n) => Number.isFinite(n));

  return items.length ? items : fallback;
}

function required(argMap: Record<string, string>, key: string): string {
  const value = argMap[key];
  if (!value) {
    throw new Error(`Missing required argument: --${key}=...`);
  }
  return value;
}

function printUsage(): void {
  // Keep it plain text; this is a CLI helper.
  console.log(`\nProvision a shop + staff user (upsert).\n\nUsage:\n  npm -w apps/api run shop:provision -- \\\n    --shopId=thaonguyencoffee \\\n    --shopName="Coffee Thảo Nguyên" \\\n    --timezone=Asia/Ho_Chi_Minh \\\n    --staffLogin=staff@thaonguyen.local \\\n    --staffPassword=your-password \\\n    --staffDisplayName="Thảo Nguyên Staff" \\\n    --awardPresets=2,3,5 \\\n    --defaultAwardPoints=1 \\\n    --dailyAwardLimitPerCustomer=3\n\nNotes:\n- Requires DATABASE_URL to point to the target shop DB.\n- shopId becomes the URL slug: /shops/<shopId>\n`);
}

function parseArgs(argv: string[]): Args {
  const argMap = readArgMap(argv);

  const shopId = required(argMap, 'shopId').trim();
  const shopName = required(argMap, 'shopName').trim();
  const staffLogin = required(argMap, 'staffLogin').trim();
  const staffPassword = required(argMap, 'staffPassword');

  const timezone = (argMap.timezone ?? 'Asia/Ho_Chi_Minh').trim();
  const staffDisplayName = (argMap.staffDisplayName ?? 'Staff').trim();

  const defaultAwardPoints = parseNumber(argMap.defaultAwardPoints, 1);
  const awardPresets = parseNumberList(argMap.awardPresets, [2, 3, 5]);
  const dailyAwardLimitPerCustomer = parseNumber(argMap.dailyAwardLimitPerCustomer, 3);

  if (!shopId) throw new Error('shopId cannot be empty');
  if (!shopName) throw new Error('shopName cannot be empty');
  if (!timezone) throw new Error('timezone cannot be empty');
  if (!staffLogin) throw new Error('staffLogin cannot be empty');
  if (!staffPassword) throw new Error('staffPassword cannot be empty');

  return {
    shopId,
    shopName,
    timezone,
    staffLogin,
    staffPassword,
    staffDisplayName,
    defaultAwardPoints,
    awardPresets,
    dailyAwardLimitPerCustomer,
  };
}

async function main() {
  const rawArgs = process.argv.slice(2);
  if (rawArgs.includes('--help') || rawArgs.includes('-h')) {
    printUsage();
    return;
  }

  const args = parseArgs(rawArgs);

  const shop = await prisma.shop.upsert({
    where: { id: args.shopId },
    update: {
      name: args.shopName,
      timezone: args.timezone,
      status: 'active',
      defaultAwardPoints: args.defaultAwardPoints,
      awardPresets: args.awardPresets,
      dailyAwardLimitPerCustomer: args.dailyAwardLimitPerCustomer,
    },
    create: {
      id: args.shopId,
      name: args.shopName,
      timezone: args.timezone,
      status: 'active',
      defaultAwardPoints: args.defaultAwardPoints,
      awardPresets: args.awardPresets,
      dailyAwardLimitPerCustomer: args.dailyAwardLimitPerCustomer,
    },
    select: { id: true, name: true, timezone: true, status: true },
  });

  const passwordHash = await hashPassword(args.staffPassword);
  const staff = await prisma.staffUser.upsert({
    where: {
      shopId_usernameOrEmail: {
        shopId: args.shopId,
        usernameOrEmail: args.staffLogin,
      },
    },
    update: {
      passwordHash,
      displayName: args.staffDisplayName,
      status: 'active',
    },
    create: {
      shopId: args.shopId,
      usernameOrEmail: args.staffLogin,
      passwordHash,
      displayName: args.staffDisplayName,
      role: 'staff',
      status: 'active',
    },
    select: { id: true, usernameOrEmail: true, displayName: true, role: true, status: true },
  });

  console.log('Provisioned shop:', shop);
  console.log('Provisioned staff user:', staff);
  console.log('shopId (URL slug):', args.shopId);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    if (String(error?.message ?? '').includes('Missing required argument')) {
      console.error(String(error.message));
      printUsage();
    } else {
      console.error(error);
      console.log('Tip: run with --help to see usage');
    }

    await prisma.$disconnect();
    process.exitCode = 1;
  });
