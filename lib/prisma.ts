import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Ensure dev-server re-creates client when new models or fields are generated into @prisma/client
const isStale =
  globalForPrisma.prisma &&
  (!(globalForPrisma.prisma as unknown as { companyPartner?: unknown }).companyPartner ||
   !(globalForPrisma.prisma as unknown as { scholarshipRecord?: unknown }).scholarshipRecord ||
   !(globalForPrisma.prisma as any)._runtimeDataModel?.models?.User?.fields?.some(
     (f: any) => f.name === "rollNumber"
   ));

export const prisma =
  globalForPrisma.prisma && !isStale
    ? globalForPrisma.prisma
    : new PrismaClient({
        log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
      });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}


