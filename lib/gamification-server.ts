import { revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";

/**
 * Idempotently awards XP to a user once per `sourceKey`.
 * If `sourceKey` was already recorded (P2002), silently returns `{ awarded: false }`.
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
