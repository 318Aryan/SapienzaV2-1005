import { sql } from "drizzle-orm";

import db from "@/db/drizzle";
import { conceptMastery } from "@/db/schema";

export const recordConceptAnswer = async (
  userId: string,
  conceptId: number | null,
  correct: boolean,
) => {
  if (!conceptId) {
    return;
  }

  await db.insert(conceptMastery).values({
    userId,
    conceptId,
    correctCount: correct ? 1 : 0,
    totalCount: 1,
  }).onConflictDoUpdate({
    target: [conceptMastery.userId, conceptMastery.conceptId],
    set: {
      correctCount: sql`${conceptMastery.correctCount} + ${correct ? 1 : 0}`,
      totalCount: sql`${conceptMastery.totalCount} + 1`,
      updatedAt: new Date(),
    },
  });
};
