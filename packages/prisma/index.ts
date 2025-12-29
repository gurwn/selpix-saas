// prisma/client.ts 와 같은 파일

import { PrismaClient } from "@prisma/client";

export * from "@prisma/client";

const createExtendedPrismaClient = () => {
  return new PrismaClient();
};

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma: PrismaClient =
  globalForPrisma.prisma ?? createExtendedPrismaClient();


if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export const db = prisma;
