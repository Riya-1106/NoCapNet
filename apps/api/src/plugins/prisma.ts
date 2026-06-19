import { PrismaClient } from "@prisma/client";

declare global {
  var nocapnetPrisma: PrismaClient | undefined;
}

export const prisma =
  globalThis.nocapnetPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"]
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.nocapnetPrisma = prisma;
}
