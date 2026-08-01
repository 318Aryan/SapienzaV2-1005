import { auth, clerkClient } from "@clerk/nextjs";
import { and, eq } from "drizzle-orm";

import db from "@/db/drizzle";
import { classEnrollments, classes } from "@/db/schema";

export type Role = "teacher" | "student";

// Role lives in Clerk publicMetadata rather than the DB: it has to be known
// right after sign-up, before any userProgress row exists (that row is only
// created once a student picks a course).
export const getUserRole = async (): Promise<Role | null> => {
  const { userId } = auth();

  if (!userId) {
    return null;
  }

  const user = await clerkClient.users.getUser(userId);
  const role = user.publicMetadata?.role;

  return role === "teacher" || role === "student" ? role : null;
};

export const isClassTeacher = async (classId: number) => {
  const { userId } = auth();

  if (!userId) {
    return false;
  }

  const classRecord = await db.query.classes.findFirst({
    where: and(eq(classes.id, classId), eq(classes.teacherId, userId)),
  });

  return !!classRecord;
};

export const isEnrolledIn = async (classId: number) => {
  const { userId } = auth();

  if (!userId) {
    return false;
  }

  const enrollment = await db.query.classEnrollments.findFirst({
    where: and(
      eq(classEnrollments.classId, classId),
      eq(classEnrollments.studentId, userId),
    ),
  });

  return !!enrollment;
};
