import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Detect if cached client in globalThis is missing recently added models
const existingClient = globalForPrisma.prisma;
const isStale = existingClient && (!("test" in existingClient) || !("systemSetting" in existingClient));

export const prisma =
  !isStale && existingClient
    ? existingClient
    : new PrismaClient({
        log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
      });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}


