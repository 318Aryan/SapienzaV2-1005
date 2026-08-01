import db from "@/db/drizzle";
import { challengeAttempts } from "@/db/schema";

export const recordChallengeAttempt = async (
  userId: string,
  challengeId: number,
  selectedOptionId: number,
  correct: boolean,
) => {
  await db.insert(challengeAttempts).values({
    userId,
    challengeId,
    selectedOptionId,
    correct,
  });
};
