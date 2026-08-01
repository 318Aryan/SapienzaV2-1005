"use server";

import { auth } from "@clerk/nextjs";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import db from "@/db/drizzle";
import {
  challengeOptions,
  challenges,
  classes,
  concepts,
  courses,
  flashcards,
  lessons,
  sourceDocuments,
  units,
} from "@/db/schema";
import { generateLearningContent } from "@/lib/ai";
import { extractPdfText } from "@/lib/pdf";
import { isClassTeacher } from "@/lib/roles";
import { getUserSubscription } from "@/db/queries";
import { FREE_TIER_LIMITS } from "@/constants";

type GenerateResult = {
  courseId: number;
  conceptCount: number;
  questionCount: number;
  flashcardCount: number;
};

export const generateContentFromUpload = async (
  formData: FormData,
): Promise<GenerateResult> => {
  const { userId } = auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const classId = Number(formData.get("classId"));
  const title = (formData.get("title") as string | null)?.trim();
  const pastedText = (formData.get("text") as string | null)?.trim();
  const file = formData.get("file") as File | null;

  if (!classId || Number.isNaN(classId)) {
    throw new Error("Class is required");
  }

  if (!title) {
    throw new Error("Title is required");
  }

  const isTeacher = await isClassTeacher(classId);

  if (!isTeacher) {
    throw new Error("Unauthorized");
  }

  const subscription = await getUserSubscription();

  if (!subscription?.isActive) {
    const existingUploads = await db.query.sourceDocuments.findMany({
      where: eq(sourceDocuments.classId, classId),
    });

    if (existingUploads.length >= FREE_TIER_LIMITS.maxUploadsPerClass) {
      throw new Error(
        `Free plan is limited to ${FREE_TIER_LIMITS.maxUploadsPerClass} uploads per class — upgrade to Teacher Pro for unlimited AI-generated content.`,
      );
    }
  }

  let sourceText = pastedText ?? "";
  let sourceType: "pdf" | "text" = "text";

  if (file && file.size > 0) {
    const buffer = Buffer.from(await file.arrayBuffer());
    sourceText = await extractPdfText(buffer);
    sourceType = "pdf";
  }

  if (!sourceText) {
    throw new Error("Provide pasted text or a PDF");
  }

  const generated = await generateLearningContent(sourceText);

  if (generated.concepts.length === 0) {
    throw new Error("AI could not identify any concepts from this material. Try again or add more text.");
  }

  const classRecord = await db.query.classes.findFirst({
    where: eq(classes.id, classId),
  });

  if (!classRecord) {
    throw new Error("Class not found");
  }

  let course = await db.query.courses.findFirst({
    where: eq(courses.classId, classId),
  });

  if (!course) {
    const [inserted] = await db.insert(courses).values({
      title: classRecord.name,
      imageSrc: "/mascot.svg",
      classId,
    }).returning();
    course = inserted;
  }

  const [sourceDocument] = await db.insert(sourceDocuments).values({
    teacherId: userId,
    classId,
    title,
    type: sourceType,
    rawText: sourceText,
  }).returning();

  const insertedConcepts = await db.insert(concepts).values(
    generated.concepts.map((conceptTitle) => ({
      courseId: course!.id,
      sourceDocumentId: sourceDocument.id,
      title: conceptTitle,
    })),
  ).returning();

  const conceptIdByTitle = new Map(
    insertedConcepts.map((concept) => [concept.title, concept.id]),
  );

  const existingUnits = await db.query.units.findMany({
    where: eq(units.courseId, course.id),
  });

  const [unit] = await db.insert(units).values({
    courseId: course.id,
    title,
    description: `Generated from "${title}"`,
    order: existingUnits.length + 1,
  }).returning();

  const [lesson] = await db.insert(lessons).values({
    unitId: unit.id,
    title,
    order: 1,
  }).returning();

  for (let index = 0; index < generated.questions.length; index++) {
    const question = generated.questions[index];
    const conceptId = conceptIdByTitle.get(question.concept) ?? null;

    const [challenge] = await db.insert(challenges).values({
      lessonId: lesson.id,
      type: "SELECT",
      question: question.question,
      order: index + 1,
      conceptId,
    }).returning();

    await db.insert(challengeOptions).values(
      question.options.map((option) => ({
        challengeId: challenge.id,
        text: option.text,
        correct: option.correct,
      })),
    );
  }

  const flashcardRows = generated.flashcards
    .map((flashcard) => {
      const conceptId = conceptIdByTitle.get(flashcard.concept);
      return conceptId
        ? { conceptId, front: flashcard.front, back: flashcard.back }
        : null;
    })
    .filter((row): row is { conceptId: number; front: string; back: string } => row !== null);

  if (flashcardRows.length > 0) {
    await db.insert(flashcards).values(flashcardRows);
  }

  revalidatePath("/teacher/classes");
  revalidatePath("/courses");
  revalidatePath("/courses");

  return {
    courseId: course.id,
    conceptCount: insertedConcepts.length,
    questionCount: generated.questions.length,
    flashcardCount: flashcardRows.length,
  };
};
