"use server";

import { auth } from "@clerk/nextjs";
import { eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import db from "@/db/drizzle";
import {
  challengeOptions,
  challenges,
  concepts,
  courses,
  flashcards,
  lessons,
  units,
} from "@/db/schema";
import { getClassConceptMastery } from "@/db/queries";
import { WEAK_MASTERY_THRESHOLD } from "@/constants";
import { generateRevisionContent } from "@/lib/ai";
import { isClassTeacher } from "@/lib/roles";

type RevisionResult = {
  unitId: number;
  questionCount: number;
  flashcardCount: number;
  weakConceptTitles: string[];
};

const normalize = (value: string) => value.trim().toLowerCase();

export const generateRevisionQuiz = async (classId: number): Promise<RevisionResult> => {
  const { userId } = auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const isTeacher = await isClassTeacher(classId);

  if (!isTeacher) {
    throw new Error("Unauthorized");
  }

  const mastery = await getClassConceptMastery(classId);
  const weakConcepts = mastery.filter(
    (concept) => concept.masteryPct !== null && concept.masteryPct < WEAK_MASTERY_THRESHOLD,
  );

  if (weakConcepts.length === 0) {
    throw new Error("No weak concepts to generate revision content for yet");
  }

  const conceptIds = weakConcepts.map((concept) => concept.conceptId);

  const conceptRows = await db.query.concepts.findMany({
    where: inArray(concepts.id, conceptIds),
    with: {
      sourceDocument: true,
    },
  });

  const sourceTexts = Array.from(
    new Set(
      conceptRows
        .map((concept) => concept.sourceDocument?.rawText)
        .filter((text): text is string => !!text),
    ),
  );

  if (sourceTexts.length === 0) {
    throw new Error("No source material available to generate revision content");
  }

  const course = await db.query.courses.findFirst({
    where: eq(courses.classId, classId),
  });

  if (!course) {
    throw new Error("Course not found");
  }

  const weakConceptTitles = weakConcepts.map((concept) => concept.title);
  const generated = await generateRevisionContent(weakConceptTitles, sourceTexts.join("\n\n---\n\n"));

  const conceptIdByNormalizedTitle = new Map(
    weakConcepts.map((concept) => [normalize(concept.title), concept.conceptId]),
  );

  const existingUnits = await db.query.units.findMany({
    where: eq(units.courseId, course.id),
  });

  const [unit] = await db.insert(units).values({
    courseId: course.id,
    title: "Revision: weak concepts",
    description: `Auto-generated revision quiz for ${weakConceptTitles.length} concept(s) below ${WEAK_MASTERY_THRESHOLD}% mastery`,
    order: existingUnits.length + 1,
  }).returning();

  const [lesson] = await db.insert(lessons).values({
    unitId: unit.id,
    title: "Revision Quiz",
    order: 1,
  }).returning();

  for (let index = 0; index < generated.questions.length; index++) {
    const question = generated.questions[index];
    const conceptId = conceptIdByNormalizedTitle.get(normalize(question.concept)) ?? null;

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
      const conceptId = conceptIdByNormalizedTitle.get(normalize(flashcard.concept));
      return conceptId
        ? { conceptId, front: flashcard.front, back: flashcard.back }
        : null;
    })
    .filter((row): row is { conceptId: number; front: string; back: string } => row !== null);

  if (flashcardRows.length > 0) {
    await db.insert(flashcards).values(flashcardRows);
  }

  revalidatePath(`/teacher/dashboard/${classId}`);
  revalidatePath("/courses");

  return {
    unitId: unit.id,
    questionCount: generated.questions.length,
    flashcardCount: flashcardRows.length,
    weakConceptTitles,
  };
};
