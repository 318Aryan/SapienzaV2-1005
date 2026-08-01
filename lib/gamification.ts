import { eq } from "drizzle-orm";

import db from "@/db/drizzle";
import { streaks, userAchievements } from "@/db/schema";

export const getLevelFromXp = (xp: number): number => Math.floor(xp / 100) + 1;

const todayDateString = () => new Date().toISOString().slice(0, 10);

const addDays = (dateString: string, days: number) => {
  const date = new Date(`${dateString}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

// Called once per first-time-correct answer (see actions/challenge-progress.ts).
// Returns the streak count *after* today's update, so callers can react to it
// (e.g. checkAndUnlockAchievements) without a second read.
export const recordDailyActivity = async (userId: string): Promise<number> => {
  const today = todayDateString();

  const existing = await db.query.streaks.findFirst({
    where: eq(streaks.userId, userId),
  });

  if (!existing) {
    await db.insert(streaks).values({
      userId,
      currentStreak: 1,
      longestStreak: 1,
      lastActiveDate: today,
    });
    return 1;
  }

  if (existing.lastActiveDate === today) {
    return existing.currentStreak;
  }

  const yesterday = addDays(today, -1);
  const nextStreak = existing.lastActiveDate === yesterday ? existing.currentStreak + 1 : 1;

  await db.update(streaks).set({
    currentStreak: nextStreak,
    longestStreak: Math.max(nextStreak, existing.longestStreak),
    lastActiveDate: today,
  }).where(eq(streaks.userId, userId));

  return nextStreak;
};

type UnlockContext = {
  previousPoints: number;
  newPoints: number;
  streak: number;
};

const crossesThreshold = (previous: number, next: number, threshold: number) =>
  previous < threshold && next >= threshold;

// Checks a fixed, hardcoded set of criteria against data the caller already
// has in hand (no extra queries beyond resolving matched keys to rows) and
// inserts only the newly-earned ones. Returns titles for the caller to toast.
export const checkAndUnlockAchievements = async (
  userId: string,
  context: UnlockContext,
): Promise<string[]> => {
  const earnedKeys: string[] = [];

  if (context.previousPoints === 0 && context.newPoints > 0) {
    earnedKeys.push("first_lesson");
  }
  if (crossesThreshold(context.previousPoints, context.newPoints, 100)) {
    earnedKeys.push("xp_100");
  }
  if (crossesThreshold(context.previousPoints, context.newPoints, 500)) {
    earnedKeys.push("xp_500");
  }
  if (context.streak === 3) {
    earnedKeys.push("streak_3");
  }
  if (context.streak === 7) {
    earnedKeys.push("streak_7");
  }

  if (earnedKeys.length === 0) {
    return [];
  }

  const matchingAchievements = await db.query.achievements.findMany({
    where: (achievements, { inArray }) => inArray(achievements.key, earnedKeys),
  });

  if (matchingAchievements.length === 0) {
    return [];
  }

  const inserted = await db.insert(userAchievements).values(
    matchingAchievements.map((achievement) => ({
      userId,
      achievementId: achievement.id,
    })),
  ).onConflictDoNothing().returning({ achievementId: userAchievements.achievementId });

  const insertedIds = new Set(inserted.map((row) => row.achievementId));

  return matchingAchievements
    .filter((achievement) => insertedIds.has(achievement.id))
    .map((achievement) => achievement.title);
};
