"use server";

import { auth } from "@clerk/nextjs";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import db from "@/db/drizzle";
import { assignmentSubmissions, assignments } from "@/db/schema";
import { getUserSubscription } from "@/db/queries";
import { isClassTeacher, isEnrolledIn } from "@/lib/roles";
import { FREE_TIER_LIMITS } from "@/constants";

type CreateAssignmentInput = {
  classId: number;
  title: string;
  description: string;
  type: "homework" | "quiz" | "exam";
  totalPoints: number;
  dueAt: string | null;
};

export const createAssignment = async (input: CreateAssignmentInput) => {
  const title = input.title?.trim();

  if (!input.classId || !title) {
    throw new Error("Class and title are required");
  }

  const isTeacher = await isClassTeacher(input.classId);

  if (!isTeacher) {
    throw new Error("Unauthorized");
  }

  const subscription = await getUserSubscription();

  if (!subscription?.isActive) {
    const existingAssignments = await db.query.assignments.findMany({
      where: eq(assignments.classId, input.classId),
    });

    if (existingAssignments.length >= FREE_TIER_LIMITS.maxAssignmentsPerClass) {
      throw new Error(
        `Free plan is limited to ${FREE_TIER_LIMITS.maxAssignmentsPerClass} assignments per class — upgrade to Teacher Pro for unlimited assignments.`,
      );
    }
  }

  await db.insert(assignments).values({
    classId: input.classId,
    title,
    description: input.description?.trim() ?? "",
    type: input.type,
    totalPoints: input.totalPoints > 0 ? input.totalPoints : 100,
    dueAt: input.dueAt ? new Date(input.dueAt) : null,
  });

  revalidatePath("/teacher/assignments");
};

const getOwnedAssignment = async (assignmentId: number) => {
  const assignment = await db.query.assignments.findFirst({
    where: eq(assignments.id, assignmentId),
  });

  if (!assignment) {
    throw new Error("Assignment not found");
  }

  const isTeacher = await isClassTeacher(assignment.classId);

  if (!isTeacher) {
    throw new Error("Unauthorized");
  }

  return assignment;
};

export const publishAssignment = async (assignmentId: number) => {
  await getOwnedAssignment(assignmentId);

  await db.update(assignments)
    .set({ status: "published" })
    .where(eq(assignments.id, assignmentId));

  revalidatePath("/teacher/assignments");
  revalidatePath(`/teacher/assignments/${assignmentId}`);
  revalidatePath("/assignments");
};

export const deleteAssignment = async (assignmentId: number) => {
  await getOwnedAssignment(assignmentId);

  await db.delete(assignments).where(eq(assignments.id, assignmentId));

  revalidatePath("/teacher/assignments");
};

export const gradeSubmission = async (
  submissionId: number,
  score: number,
  feedback: string,
) => {
  const { userId } = auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const submission = await db.query.assignmentSubmissions.findFirst({
    where: eq(assignmentSubmissions.id, submissionId),
    with: { assignment: true },
  });

  if (!submission) {
    throw new Error("Submission not found");
  }

  const isTeacher = await isClassTeacher(submission.assignment.classId);

  if (!isTeacher) {
    throw new Error("Unauthorized");
  }

  if (score < 0 || score > submission.assignment.totalPoints) {
    throw new Error(`Score must be between 0 and ${submission.assignment.totalPoints}`);
  }

  await db.update(assignmentSubmissions).set({
    status: "graded",
    score,
    feedback: feedback.trim() || null,
    gradedAt: new Date(),
  }).where(eq(assignmentSubmissions.id, submissionId));

  revalidatePath(`/teacher/assignments/${submission.assignmentId}`);
  revalidatePath("/assignments");
};

export const submitAssignment = async (assignmentId: number, responseText: string) => {
  const { userId } = auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const trimmed = responseText.trim();

  if (!trimmed) {
    throw new Error("Write a response before submitting");
  }

  const assignment = await db.query.assignments.findFirst({
    where: and(eq(assignments.id, assignmentId), eq(assignments.status, "published")),
  });

  if (!assignment) {
    throw new Error("Assignment not found");
  }

  const enrolled = await isEnrolledIn(assignment.classId);

  if (!enrolled) {
    throw new Error("Unauthorized");
  }

  const existing = await db.query.assignmentSubmissions.findFirst({
    where: and(
      eq(assignmentSubmissions.assignmentId, assignmentId),
      eq(assignmentSubmissions.studentId, userId),
    ),
  });

  if (existing?.status === "graded") {
    throw new Error("This assignment has already been graded");
  }

  if (existing) {
    await db.update(assignmentSubmissions).set({
      responseText: trimmed,
      status: "submitted",
      submittedAt: new Date(),
    }).where(eq(assignmentSubmissions.id, existing.id));
  } else {
    await db.insert(assignmentSubmissions).values({
      assignmentId,
      studentId: userId,
      responseText: trimmed,
      status: "submitted",
      submittedAt: new Date(),
    });
  }

  revalidatePath(`/assignments/${assignmentId}`);
  revalidatePath("/assignments");
};
