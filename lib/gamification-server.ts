import { revalidateTag, unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

const getRatingModuleEnabledCached = unstable_cache(
  async () => {
    try {
      const setting = await prisma.systemSetting.findUnique({
        where: { key: "feature_rating" },
        select: { value: true },
      });
      if (!setting) return true;
      return setting.value !== "false";
    } catch {
      return true;
    }
  },
  ["feature-rating-enabled"],
  { revalidate: 60, tags: ["feature-modules"] },
);

export async function isRatingModuleEnabled(): Promise<boolean> {
  return getRatingModuleEnabledCached();
}

/**
 * Idempotently awards XP to a user once per `sourceKey`.
 * If the rating module is disabled or `sourceKey` was already recorded (P2002),
 * skips all XP writes and returns `{ awarded: false }`.
 */
export async function awardXpOnce(params: {
  userId: string;
  amount: number;
  reason: string;
  sourceKey: string;
}): Promise<{ awarded: boolean }> {
  if (!params.userId || params.amount <= 0) {
    return { awarded: false };
  }

  const enabled = await isRatingModuleEnabled();
  if (!enabled) {
    return { awarded: false };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.xpTransaction.create({
        data: {
          userId: params.userId,
          amount: params.amount,
          reason: params.reason,
          sourceKey: params.sourceKey,
        },
      });

      await tx.user.update({
        where: { id: params.userId },
        data: {
          xp: { increment: params.amount },
        },
      });
    });

    try {
      revalidateTag("rating-leaderboard", "max");
    } catch {
      // ignore if called outside Next.js request context
    }

    return { awarded: true };
  } catch (err) {
    const code = (err as { code?: string })?.code;
    if (code === "P2002") {
      return { awarded: false };
    }
    console.warn("awardXpOnce failed:", err);
    return { awarded: false };
  }
}
