"use server";

import { auth } from "@clerk/nextjs";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import db from "@/db/drizzle";
import { getUserProgress, getUserSubscription } from "@/db/queries";
import { challengeProgress, challenges, userProgress } from "@/db/schema";
import { recordConceptAnswer } from "@/lib/concept-mastery";
import { recordChallengeAttempt } from "@/lib/challenge-attempts";
import { checkAndUnlockAchievements, recordDailyActivity } from "@/lib/gamification";

export const upsertChallengeProgress = async (challengeId: number, selectedOptionId: number) => {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const currentUserProgress = await getUserProgress();
  const userSubscription = await getUserSubscription();

  if (!currentUserProgress) {
    throw new Error("User progress not found");
  }

  const challenge = await db.query.challenges.findFirst({
    where: eq(challenges.id, challengeId)
  });

  if (!challenge) {
    throw new Error("Challenge not found");
  }

  const lessonId = challenge.lessonId;

  const existingChallengeProgress = await db.query.challengeProgress.findFirst({
    where: and(
      eq(challengeProgress.userId, userId),
      eq(challengeProgress.challengeId, challengeId),
    ),
  });

  const isPractice = !!existingChallengeProgress;

  if (
    currentUserProgress.hearts === 0 &&
    !isPractice &&
    !userSubscription?.isActive
  ) {
    return { error: "hearts" };
  }

  if (isPractice) {
    await db.update(challengeProgress).set({
      completed: true,
    })
    .where(
      eq(challengeProgress.id, existingChallengeProgress.id)
    );

    await db.update(userProgress).set({
      hearts: currentUserProgress.hearts,
      points: currentUserProgress.points,
    }).where(eq(userProgress.userId, userId));

    revalidatePath("/courses");
    revalidatePath("/lesson");
    revalidatePath("/quests");
    revalidatePath("/achievements");
    revalidatePath(`/lesson/${lessonId}`);
    return;
  }

  await db.insert(challengeProgress).values({
    challengeId,
    userId,
    completed: true,
  });

  const previousPoints = currentUserProgress.points;
  const newPoints = previousPoints + 10;

  await db.update(userProgress).set({
    points: newPoints,
  }).where(eq(userProgress.userId, userId));

  await recordConceptAnswer(userId, challenge.conceptId, true);
  await recordChallengeAttempt(userId, challengeId, selectedOptionId, true);

  const streak = await recordDailyActivity(userId);
  const newAchievements = await checkAndUnlockAchievements(userId, {
    previousPoints,
    newPoints,
    streak,
  });

  revalidatePath("/courses");
  revalidatePath("/lesson");
  revalidatePath("/quests");
  revalidatePath("/achievements");
  revalidatePath(`/lesson/${lessonId}`);

  return { newAchievements };
};
