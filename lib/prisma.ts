import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient; mediaNameColumnEnsured?: boolean };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"] });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

/**
 * Ensures the `name` column exists on `media_assets` table in MySQL.
 * Runs once per process, self-healing any environments where migrations have not yet executed.
 */
export async function ensureMediaNameColumn() {
  if (globalForPrisma.mediaNameColumnEnsured) return;
  try {
    await prisma.$executeRawUnsafe(
      "ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS name VARCHAR(255) NULL"
    );
    globalForPrisma.mediaNameColumnEnsured = true;
  } catch {
    try {
      await prisma.$executeRawUnsafe(
        "ALTER TABLE media_assets ADD COLUMN name VARCHAR(255) NULL"
      );
      globalForPrisma.mediaNameColumnEnsured = true;
    } catch {
      // Column already exists or table cannot be modified; ignore
      globalForPrisma.mediaNameColumnEnsured = true;
    }
  }
}

