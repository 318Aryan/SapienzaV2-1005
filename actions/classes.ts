"use server";

import { auth, currentUser } from "@clerk/nextjs";
import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import db from "@/db/drizzle";
import { classEnrollments, classes, courses, userProgress } from "@/db/schema";
import { getUserSubscription } from "@/db/queries";
import { FREE_TIER_LIMITS } from "@/constants";

const generateJoinCode = () => {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
};

export const createClass = async (name: string) => {
  const { userId } = auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const trimmedName = name?.trim();

  if (!trimmedName) {
    throw new Error("Class name is required");
  }

  const subscription = await getUserSubscription();

  if (!subscription?.isActive) {
    const existingClasses = await db.query.classes.findMany({
      where: eq(classes.teacherId, userId),
    });

    if (existingClasses.length >= FREE_TIER_LIMITS.maxClasses) {
      throw new Error(
        `Free plan is limited to ${FREE_TIER_LIMITS.maxClasses} classes — upgrade to Teacher Pro for unlimited classes.`,
      );
    }
  }

  let joinCode = generateJoinCode();
  let existing = await db.query.classes.findFirst({
    where: eq(classes.joinCode, joinCode),
  });

  while (existing) {
    joinCode = generateJoinCode();
    // eslint-disable-next-line no-await-in-loop
    existing = await db.query.classes.findFirst({
      where: eq(classes.joinCode, joinCode),
    });
  }

  await db.insert(classes).values({
    teacherId: userId,
    name: trimmedName,
    joinCode,
  });

  revalidatePath("/teacher/classes");
};

export const joinClass = async (code: string) => {
  const { userId } = auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const normalizedCode = code?.trim().toUpperCase();

  if (!normalizedCode) {
    throw new Error("Join code is required");
  }

  const classRecord = await db.query.classes.findFirst({
    where: eq(classes.joinCode, normalizedCode),
  });

  if (!classRecord) {
    throw new Error("Invalid join code");
  }

  const existingEnrollment = await db.query.classEnrollments.findFirst({
    where: and(
      eq(classEnrollments.classId, classRecord.id),
      eq(classEnrollments.studentId, userId),
    ),
  });

  if (!existingEnrollment) {
    await db.insert(classEnrollments).values({
      classId: classRecord.id,
      studentId: userId,
    });
  }

  revalidatePath("/courses");
  revalidatePath("/home");

  // First class ever joined, and the teacher already has material up: drop
  // the student straight into Learn instead of making them pick it from
  // "My Classes" — mirrors the old single-course-catalog flow. A student
  // joining a second (or later) class always lands on "My Classes" so they
  // can see it alongside their existing classes rather than having it
  // silently swap out whatever course they're currently on.
  const existingProgress = await db.query.userProgress.findFirst({
    where: eq(userProgress.userId, userId),
  });

  if (!existingProgress) {
    const classCourse = await db.query.courses.findFirst({
      where: eq(courses.classId, classRecord.id),
    });

    if (classCourse) {
      const user = await currentUser();

      await db.insert(userProgress).values({
        userId,
        activeCourseId: classCourse.id,
        userName: user?.firstName || "User",
        userImageSrc: user?.imageUrl || "/mascot.svg",
      });

      revalidatePath("/home");
      redirect("/home");
    }
  }

  redirect("/courses");
};
