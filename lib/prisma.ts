import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient; mediaNameColumnEnsured?: boolean };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"] });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

/**
 * Ensures the `name` column exists on `media_assets` table in MySQL.
 * Checks information_schema first, then alters table if needed.
 */
export async function ensureMediaNameColumn(): Promise<boolean> {
  if (globalForPrisma.mediaNameColumnEnsured) return true;
  try {
    const existing = await prisma.$queryRaw<unknown[]>`
      SELECT COLUMN_NAME
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'media_assets'
        AND COLUMN_NAME = 'name'
      LIMIT 1
    `;
    if (Array.isArray(existing) && existing.length > 0) {
      globalForPrisma.mediaNameColumnEnsured = true;
      return true;
    }

    await prisma.$executeRawUnsafe(
      "ALTER TABLE `media_assets` ADD COLUMN `name` VARCHAR(255) NULL"
    );
    globalForPrisma.mediaNameColumnEnsured = true;
    return true;
  } catch (err) {
    console.error("ensureMediaNameColumn error:", err);
    return false;
  }
}

