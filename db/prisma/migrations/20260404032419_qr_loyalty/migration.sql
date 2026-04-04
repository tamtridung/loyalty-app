-- CreateEnum
CREATE TYPE "ShopStatus" AS ENUM ('active', 'inactive');

-- CreateEnum
CREATE TYPE "StaffRole" AS ENUM ('owner', 'manager', 'staff');

-- CreateEnum
CREATE TYPE "StaffStatus" AS ENUM ('active', 'disabled');

-- CreateEnum
CREATE TYPE "CustomerLoginType" AS ENUM ('phone', 'email');

-- CreateEnum
CREATE TYPE "PointTransactionStatus" AS ENUM ('success', 'failed');

-- CreateTable
CREATE TABLE "Shop" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "status" "ShopStatus" NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "defaultAwardPoints" INTEGER NOT NULL DEFAULT 1,
    "awardPresets" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "dailyAwardLimitPerCustomer" INTEGER NOT NULL DEFAULT 3,

    CONSTRAINT "Shop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffUser" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "usernameOrEmail" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "displayName" TEXT,
    "role" "StaffRole" NOT NULL DEFAULT 'staff',
    "status" "StaffStatus" NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastLoginAt" TIMESTAMP(3),

    CONSTRAINT "StaffUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "loginId" TEXT NOT NULL,
    "loginType" "CustomerLoginType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Membership" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "displayName" TEXT,
    "pointsBalance" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Membership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PointTransaction" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "staffUserId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "pointsAwarded" INTEGER NOT NULL,
    "status" "PointTransactionStatus" NOT NULL DEFAULT 'success',
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "shopLocalDate" TEXT NOT NULL,

    CONSTRAINT "PointTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StaffUser_shopId_idx" ON "StaffUser"("shopId");

-- CreateIndex
CREATE UNIQUE INDEX "StaffUser_shopId_usernameOrEmail_key" ON "StaffUser"("shopId", "usernameOrEmail");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_loginId_key" ON "Customer"("loginId");

-- CreateIndex
CREATE INDEX "Membership_shopId_idx" ON "Membership"("shopId");

-- CreateIndex
CREATE INDEX "Membership_customerId_idx" ON "Membership"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "Membership_shopId_customerId_key" ON "Membership"("shopId", "customerId");

-- CreateIndex
CREATE INDEX "PointTransaction_shopId_customerId_createdAt_idx" ON "PointTransaction"("shopId", "customerId", "createdAt");

-- CreateIndex
CREATE INDEX "PointTransaction_shopId_customerId_shopLocalDate_idx" ON "PointTransaction"("shopId", "customerId", "shopLocalDate");

-- CreateIndex
CREATE INDEX "PointTransaction_shopId_createdAt_idx" ON "PointTransaction"("shopId", "createdAt");

-- AddForeignKey
ALTER TABLE "StaffUser" ADD CONSTRAINT "StaffUser_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PointTransaction" ADD CONSTRAINT "PointTransaction_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PointTransaction" ADD CONSTRAINT "PointTransaction_staffUserId_fkey" FOREIGN KEY ("staffUserId") REFERENCES "StaffUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PointTransaction" ADD CONSTRAINT "PointTransaction_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
