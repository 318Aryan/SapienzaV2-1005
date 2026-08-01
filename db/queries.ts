import { cache } from "react";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { auth } from "@clerk/nextjs";

import db from "@/db/drizzle";
import {
  achievements,
  assignmentSubmissions,
  assignments,
  challengeAttempts,
  challengeProgress,
  challenges,
  classEnrollments,
  classes,
  conceptMastery,
  concepts,
  courses,
  lessons,
  sourceDocuments,
  streaks,
  units,
  userAchievements,
  userProgress,
  userSubscription,
} from "@/db/schema";
import { isEnrolledIn } from "@/lib/roles";

export const getUserProgress = cache(async () => {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  // Explicit join to get user progress + active course data
  const data = await db
    .select({
      userId: userProgress.userId,
      userName: userProgress.userName,
      userImageSrc: userProgress.userImageSrc,
      activeCourseId: userProgress.activeCourseId,
      hearts: userProgress.hearts,
      points: userProgress.points,
      activeCourse: {
        id: courses.id,
        title: courses.title,
        imageSrc: courses.imageSrc,
        classId: courses.classId,
      },
    })
    .from(userProgress)
    .leftJoin(courses, eq(courses.id, userProgress.activeCourseId))
    .where(eq(userProgress.userId, userId))
    .limit(1);

  return data.length > 0 ? data[0] : null;
});

export const getUnits = cache(async () => {
  const { userId } = await auth();
  const userProg = await getUserProgress();

  if (!userId || !userProg?.activeCourseId) {
    return [];
  }

  const data = await db.query.units.findMany({
    orderBy: (units, { asc }) => [asc(units.order)],
    where: eq(units.courseId, userProg.activeCourseId),
    with: {
      lessons: {
        orderBy: (lessons, { asc }) => [asc(lessons.order)],
        with: {
          challenges: {
            orderBy: (challenges, { asc }) => [asc(challenges.order)],
            with: {
              challengeProgress: {
                where: eq(challengeProgress.userId, userId),
              },
            },
          },
        },
      },
    },
  });

  const normalizedData = data.map((unit) => {
    const lessonsWithCompletedStatus = unit.lessons.map((lesson) => {
      if (lesson.challenges.length === 0) {
        return { ...lesson, completed: false };
      }

      const allCompletedChallenges = lesson.challenges.every((challenge) => {
        return (
          challenge.challengeProgress &&
          challenge.challengeProgress.length > 0 &&
          challenge.challengeProgress.every((progress) => progress.completed)
        );
      });

      return { ...lesson, completed: allCompletedChallenges };
    });

    return { ...unit, lessons: lessonsWithCompletedStatus };
  });

  return normalizedData;
});

export const getCourses = cache(async () => {
  const { userId } = await auth();

  const enrollments = userId
    ? await db.query.classEnrollments.findMany({
        where: eq(classEnrollments.studentId, userId),
      })
    : [];
  const enrolledClassIds = enrollments.map((enrollment) => enrollment.classId);

  const data = await db.query.courses.findMany({
    where: (courses, { isNull, inArray, or }) =>
      enrolledClassIds.length > 0
        ? or(isNull(courses.classId), inArray(courses.classId, enrolledClassIds))
        : isNull(courses.classId),
  });

  return data;
});

// Distinguishes "enrolled, teacher hasn't uploaded material yet" from
// "enrolled and ready to learn" — getCourses() alone can't tell those apart
// since a class with no course row simply doesn't show up in it.
export const getEnrolledClassesWithCourseStatus = cache(async () => {
  const { userId } = await auth();

  if (!userId) {
    return [];
  }

  const enrollments = await db.query.classEnrollments.findMany({
    where: eq(classEnrollments.studentId, userId),
    with: {
      class: {
        with: {
          courses: true,
        },
      },
    },
  });

  return enrollments.map((enrollment) => ({
    classId: enrollment.classId,
    className: enrollment.class.name,
    course: enrollment.class.courses[0] ?? null,
  }));
});

export const getCourseById = cache(async (courseId: number) => {
  const data = await db.query.courses.findFirst({
    where: eq(courses.id, courseId),
    with: {
      units: {
        orderBy: (units, { asc }) => [asc(units.order)],
        with: {
          lessons: {
            orderBy: (lessons, { asc }) => [asc(lessons.order)],
          },
        },
      },
    },
  });

  return data;
});

export const getCourseProgress = cache(async () => {
  const { userId } = await auth();
  const userProg = await getUserProgress();

  if (!userId || !userProg?.activeCourseId) {
    return null;
  }

  const unitsInActiveCourse = await db.query.units.findMany({
    orderBy: (units, { asc }) => [asc(units.order)],
    where: eq(units.courseId, userProg.activeCourseId),
    with: {
      lessons: {
        orderBy: (lessons, { asc }) => [asc(lessons.order)],
        with: {
          unit: true,
          challenges: {
            with: {
              challengeProgress: {
                where: eq(challengeProgress.userId, userId),
              },
            },
          },
        },
      },
    },
  });

  const firstUncompletedLesson = unitsInActiveCourse
    .flatMap((unit) => unit.lessons)
    .find((lesson) => {
      return lesson.challenges.some((challenge) => {
        return (
          !challenge.challengeProgress ||
          challenge.challengeProgress.length === 0 ||
          challenge.challengeProgress.some((progress) => progress.completed === false)
        );
      });
    });

  return {
    activeLesson: firstUncompletedLesson,
    activeLessonId: firstUncompletedLesson?.id,
  };
});

export const getLesson = cache(async (id?: number) => {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  const courseProgress = await getCourseProgress();

  const lessonId = id || courseProgress?.activeLessonId;

  if (!lessonId) {
    return null;
  }

  const data = await db.query.lessons.findFirst({
    where: eq(lessons.id, lessonId),
    with: {
      challenges: {
        orderBy: (challenges, { asc }) => [asc(challenges.order)],
        with: {
          challengeOptions: true,
          challengeProgress: {
            where: eq(challengeProgress.userId, userId),
          },
        },
      },
    },
  });

  if (!data || !data.challenges) {
    return null;
  }

  const normalizedChallenges = data.challenges.map((challenge) => {
    const completed =
      challenge.challengeProgress &&
      challenge.challengeProgress.length > 0 &&
      challenge.challengeProgress.every((progress) => progress.completed);

    return { ...challenge, completed };
  });

  return { ...data, challenges: normalizedChallenges };
});

export const getLessonPercentage = cache(async () => {
  const courseProgress = await getCourseProgress();

  if (!courseProgress?.activeLessonId) {
    return 0;
  }

  const lesson = await getLesson(courseProgress.activeLessonId);

  if (!lesson) {
    return 0;
  }

  const completedChallenges = lesson.challenges.filter((challenge) => challenge.completed);
  const percentage = Math.round((completedChallenges.length / lesson.challenges.length) * 100);

  return percentage;
});

const DAY_IN_MS = 86_400_000;

export const getUserSubscription = cache(async () => {
  const { userId } = await auth();

  if (!userId) return null;

  const data = await db.query.userSubscription.findFirst({
    where: eq(userSubscription.userId, userId),
  });

  if (!data) return null;

  const isActive =
    data.stripePriceId && data.stripeCurrentPeriodEnd?.getTime()! + DAY_IN_MS > Date.now();

  return {
    ...data,
    isActive: !!isActive,
  };
});

export const getTopTenUsers = cache(async () => {
  const { userId } = await auth();

  if (!userId) {
    return [];
  }

  const data = await db.query.userProgress.findMany({
    orderBy: (userProgress, { desc }) => [desc(userProgress.points)],
    limit: 10,
    columns: {
      userId: true,
      userName: true,
      userImageSrc: true,
      points: true,
    },
  });

  return data;
});

export const getClassesByTeacher = cache(async () => {
  const { userId } = await auth();

  if (!userId) {
    return [];
  }

  const data = await db.query.classes.findMany({
    where: eq(classes.teacherId, userId),
    orderBy: (classes, { desc }) => [desc(classes.createdAt)],
    with: {
      enrollments: true,
    },
  });

  return data;
});

export type TeacherActivityEvent = {
  id: string;
  type: "join" | "submission";
  timestamp: Date;
  label: string;
  className: string;
};

// Merges two independent event streams (class joins, assignment
// submissions) into one timeline. Only the Overview page uses this — it's
// the one section designed to almost always have *something* to show, even
// on a quiet week when "Needs grading" and "Due this week" are both empty.
export const getRecentActivityForTeacher = cache(async (limit = 8): Promise<TeacherActivityEvent[]> => {
  const { userId } = await auth();

  if (!userId) {
    return [];
  }

  const teacherClasses = await db.query.classes.findMany({
    where: eq(classes.teacherId, userId),
  });
  const classIds = teacherClasses.map((classRecord) => classRecord.id);

  if (classIds.length === 0) {
    return [];
  }

  const classNameById = new Map(teacherClasses.map((classRecord) => [classRecord.id, classRecord.name]));

  const recentEnrollments = await db.query.classEnrollments.findMany({
    where: inArray(classEnrollments.classId, classIds),
    orderBy: (enrollment, { desc }) => [desc(enrollment.enrolledAt)],
    limit,
  });

  const teacherAssignments = await db.query.assignments.findMany({
    where: inArray(assignments.classId, classIds),
  });
  const assignmentIds = teacherAssignments.map((assignment) => assignment.id);
  const assignmentById = new Map(teacherAssignments.map((assignment) => [assignment.id, assignment]));

  const recentSubmissions = assignmentIds.length > 0
    ? await db.query.assignmentSubmissions.findMany({
        where: inArray(assignmentSubmissions.assignmentId, assignmentIds),
        orderBy: (submission, { desc }) => [desc(submission.submittedAt)],
        limit,
      })
    : [];

  const studentIds = Array.from(new Set([
    ...recentEnrollments.map((enrollment) => enrollment.studentId),
    ...recentSubmissions.map((submission) => submission.studentId),
  ]));
  const progressRows = studentIds.length > 0
    ? await db.query.userProgress.findMany({ where: inArray(userProgress.userId, studentIds) })
    : [];
  const nameByUserId = new Map(progressRows.map((p) => [p.userId, p.userName]));

  const events: TeacherActivityEvent[] = [];

  for (const enrollment of recentEnrollments) {
    events.push({
      id: `enroll-${enrollment.id}`,
      type: "join",
      timestamp: enrollment.enrolledAt,
      label: `${nameByUserId.get(enrollment.studentId) ?? "A student"} joined`,
      className: classNameById.get(enrollment.classId) ?? "",
    });
  }

  for (const submission of recentSubmissions) {
    if (!submission.submittedAt) continue;
    const assignment = assignmentById.get(submission.assignmentId);

    events.push({
      id: `submit-${submission.id}`,
      type: "submission",
      timestamp: submission.submittedAt,
      label: `${nameByUserId.get(submission.studentId) ?? "A student"} submitted "${assignment?.title ?? "an assignment"}"`,
      className: classNameById.get(assignment?.classId ?? -1) ?? "",
    });
  }

  return events
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, limit);
});

// Map of classId -> upload count, scoped to the current teacher's own
// classes. Used only by the Billing page to show usage against the
// free-tier upload cap (see FREE_TIER_LIMITS in constants.ts).
export const getTeacherUploadCounts = cache(async () => {
  const { userId } = await auth();

  if (!userId) {
    return new Map<number, number>();
  }

  const teacherClasses = await db.query.classes.findMany({
    where: eq(classes.teacherId, userId),
  });
  const classIds = teacherClasses.map((classRecord) => classRecord.id);

  if (classIds.length === 0) {
    return new Map<number, number>();
  }

  const uploads = await db.query.sourceDocuments.findMany({
    where: inArray(sourceDocuments.classId, classIds),
  });

  const counts = new Map<number, number>();
  for (const upload of uploads) {
    counts.set(upload.classId, (counts.get(upload.classId) ?? 0) + 1);
  }

  return counts;
});

export const getClassConceptMastery = cache(async (classId: number) => {
  const course = await db.query.courses.findFirst({
    where: eq(courses.classId, classId),
  });

  if (!course) {
    return [];
  }

  const conceptRows = await db.query.concepts.findMany({
    where: eq(concepts.courseId, course.id),
  });

  const enrollments = await db.query.classEnrollments.findMany({
    where: eq(classEnrollments.classId, classId),
  });
  const studentIds = enrollments.map((enrollment) => enrollment.studentId);

  if (studentIds.length === 0) {
    return conceptRows.map((concept) => ({
      conceptId: concept.id,
      title: concept.title,
      correctCount: 0,
      totalCount: 0,
      masteryPct: null as number | null,
    }));
  }

  const rows = await db
    .select({
      conceptId: concepts.id,
      title: concepts.title,
      correctCount: sql<number>`coalesce(sum(${conceptMastery.correctCount}), 0)`,
      totalCount: sql<number>`coalesce(sum(${conceptMastery.totalCount}), 0)`,
    })
    .from(concepts)
    .leftJoin(
      conceptMastery,
      and(
        eq(conceptMastery.conceptId, concepts.id),
        inArray(conceptMastery.userId, studentIds),
      ),
    )
    .where(eq(concepts.courseId, course.id))
    .groupBy(concepts.id, concepts.title);

  return rows.map((row) => ({
    ...row,
    masteryPct: row.totalCount > 0 ? Math.round((row.correctCount / row.totalCount) * 100) : null,
  }));
});

export const getAtRiskStudents = cache(async (classId: number) => {
  const course = await db.query.courses.findFirst({
    where: eq(courses.classId, classId),
  });

  if (!course) {
    return [];
  }

  const enrollments = await db.query.classEnrollments.findMany({
    where: eq(classEnrollments.classId, classId),
  });
  const studentIds = enrollments.map((enrollment) => enrollment.studentId);

  if (studentIds.length === 0) {
    return [];
  }

  const conceptRows = await db.query.concepts.findMany({
    where: eq(concepts.courseId, course.id),
  });
  const conceptIds = conceptRows.map((concept) => concept.id);

  // Start from the full roster, not from conceptMastery — a student with zero
  // attempts has no conceptMastery rows at all, and querying FROM conceptMastery
  // would silently drop them instead of flagging "hasn't started" as at-risk.
  const masteryRows = conceptIds.length > 0
    ? await db
        .select({
          userId: conceptMastery.userId,
          correctCount: sql<number>`coalesce(sum(${conceptMastery.correctCount}), 0)`,
          totalCount: sql<number>`coalesce(sum(${conceptMastery.totalCount}), 0)`,
        })
        .from(conceptMastery)
        .where(
          and(
            inArray(conceptMastery.userId, studentIds),
            inArray(conceptMastery.conceptId, conceptIds),
          ),
        )
        .groupBy(conceptMastery.userId)
    : [];

  const masteryByUserId = new Map(masteryRows.map((row) => [row.userId, row]));

  const progressRows = await db.query.userProgress.findMany({
    where: inArray(userProgress.userId, studentIds),
  });
  const nameByUserId = new Map(progressRows.map((p) => [p.userId, p.userName]));

  return studentIds
    .map((studentId) => {
      const mastery = masteryByUserId.get(studentId);
      const totalAnswers = mastery?.totalCount ?? 0;
      const masteryPct = mastery && mastery.totalCount > 0
        ? Math.round((mastery.correctCount / mastery.totalCount) * 100)
        : null;

      return {
        userId: studentId,
        userName: nameByUserId.get(studentId) ?? "Student",
        totalAnswers,
        masteryPct,
      };
    })
    // Never-attempted (null) sorts first — that's the most at-risk state, not neutral.
    .sort((a, b) => (a.masteryPct ?? -1) - (b.masteryPct ?? -1));
});

// Cross-class roster: every distinct student across every class this teacher
// owns, deduped (a student can be in more than one of the teacher's classes),
// with mastery/assignment stats aggregated across all of them.
export const getStudentsForTeacher = cache(async () => {
  const { userId } = await auth();

  if (!userId) {
    return [];
  }

  const teacherClasses = await db.query.classes.findMany({
    where: eq(classes.teacherId, userId),
  });
  const classIds = teacherClasses.map((classRecord) => classRecord.id);

  if (classIds.length === 0) {
    return [];
  }

  const classNameById = new Map(teacherClasses.map((classRecord) => [classRecord.id, classRecord.name]));

  const enrollments = await db.query.classEnrollments.findMany({
    where: inArray(classEnrollments.classId, classIds),
  });

  const classIdsByStudent = new Map<string, number[]>();
  for (const enrollment of enrollments) {
    const existing = classIdsByStudent.get(enrollment.studentId) ?? [];
    existing.push(enrollment.classId);
    classIdsByStudent.set(enrollment.studentId, existing);
  }

  const studentIds = Array.from(classIdsByStudent.keys());

  if (studentIds.length === 0) {
    return [];
  }

  const progressRows = await db.query.userProgress.findMany({
    where: inArray(userProgress.userId, studentIds),
  });
  const nameByUserId = new Map(progressRows.map((p) => [p.userId, p.userName]));
  const pointsByUserId = new Map(progressRows.map((p) => [p.userId, p.points]));

  const coursesForClasses = await db.query.courses.findMany({
    where: inArray(courses.classId, classIds),
  });
  const courseIds = coursesForClasses.map((course) => course.id);
  const conceptsForCourses = courseIds.length > 0
    ? await db.query.concepts.findMany({ where: inArray(concepts.courseId, courseIds) })
    : [];
  const conceptIds = conceptsForCourses.map((concept) => concept.id);

  const masteryRows = conceptIds.length > 0
    ? await db
        .select({
          userId: conceptMastery.userId,
          correctCount: sql<number>`coalesce(sum(${conceptMastery.correctCount}), 0)`,
          totalCount: sql<number>`coalesce(sum(${conceptMastery.totalCount}), 0)`,
        })
        .from(conceptMastery)
        .where(and(inArray(conceptMastery.userId, studentIds), inArray(conceptMastery.conceptId, conceptIds)))
        .groupBy(conceptMastery.userId)
    : [];
  const masteryByUserId = new Map(masteryRows.map((row) => [row.userId, row]));

  const assignmentsForClasses = await db.query.assignments.findMany({
    where: inArray(assignments.classId, classIds),
  });
  const assignmentIds = assignmentsForClasses.map((assignment) => assignment.id);

  const submissionRows = assignmentIds.length > 0
    ? await db.query.assignmentSubmissions.findMany({
        where: and(
          inArray(assignmentSubmissions.assignmentId, assignmentIds),
          inArray(assignmentSubmissions.studentId, studentIds),
        ),
      })
    : [];

  const submittedCountByStudent = new Map<string, number>();
  const gradedCountByStudent = new Map<string, number>();
  for (const submission of submissionRows) {
    if (submission.status === "submitted" || submission.status === "graded") {
      submittedCountByStudent.set(submission.studentId, (submittedCountByStudent.get(submission.studentId) ?? 0) + 1);
    }
    if (submission.status === "graded") {
      gradedCountByStudent.set(submission.studentId, (gradedCountByStudent.get(submission.studentId) ?? 0) + 1);
    }
  }

  return studentIds
    .map((studentId) => {
      const mastery = masteryByUserId.get(studentId);
      const masteryPct = mastery && mastery.totalCount > 0
        ? Math.round((mastery.correctCount / mastery.totalCount) * 100)
        : null;

      return {
        userId: studentId,
        userName: nameByUserId.get(studentId) ?? "Student",
        points: pointsByUserId.get(studentId) ?? 0,
        classNames: (classIdsByStudent.get(studentId) ?? []).map((id) => classNameById.get(id) ?? "").filter(Boolean),
        masteryPct,
        assignmentsSubmitted: submittedCountByStudent.get(studentId) ?? 0,
        assignmentsGraded: gradedCountByStudent.get(studentId) ?? 0,
      };
    })
    .sort((a, b) => (a.masteryPct ?? -1) - (b.masteryPct ?? -1));
});

// Full detail for one student, scoped to classes shared with the requesting
// teacher. Returns null both when the student doesn't exist AND when they're
// not in any of this teacher's classes — same outward behavior either way,
// which is the point: a teacher gets zero signal about students outside
// their own classes, not even a "found but forbidden" response.
export const getStudentProfileForTeacher = cache(async (studentId: string) => {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  const teacherClasses = await db.query.classes.findMany({
    where: eq(classes.teacherId, userId),
  });
  const classIds = teacherClasses.map((classRecord) => classRecord.id);

  if (classIds.length === 0) {
    return null;
  }

  const sharedEnrollments = await db.query.classEnrollments.findMany({
    where: and(eq(classEnrollments.studentId, studentId), inArray(classEnrollments.classId, classIds)),
  });

  if (sharedEnrollments.length === 0) {
    return null;
  }

  const sharedClassIds = sharedEnrollments.map((enrollment) => enrollment.classId);
  const sharedClasses = teacherClasses.filter((classRecord) => sharedClassIds.includes(classRecord.id));
  const classNameById = new Map(sharedClasses.map((classRecord) => [classRecord.id, classRecord.name]));

  const [progress, streak] = await Promise.all([
    db.query.userProgress.findFirst({ where: eq(userProgress.userId, studentId) }),
    db.query.streaks.findFirst({ where: eq(streaks.userId, studentId) }),
  ]);

  const coursesForClasses = await db.query.courses.findMany({
    where: inArray(courses.classId, sharedClassIds),
  });
  const courseIds = coursesForClasses.map((course) => course.id);
  const conceptsForCourses = courseIds.length > 0
    ? await db.query.concepts.findMany({ where: inArray(concepts.courseId, courseIds) })
    : [];

  const masteryRows = conceptsForCourses.length > 0
    ? await db.query.conceptMastery.findMany({
        where: and(
          eq(conceptMastery.userId, studentId),
          inArray(conceptMastery.conceptId, conceptsForCourses.map((concept) => concept.id)),
        ),
      })
    : [];
  const masteryByConceptId = new Map(masteryRows.map((row) => [row.conceptId, row]));

  const conceptMasteryList = conceptsForCourses.map((concept) => {
    const mastery = masteryByConceptId.get(concept.id);
    return {
      conceptId: concept.id,
      title: concept.title,
      masteryPct: mastery && mastery.totalCount > 0
        ? Math.round((mastery.correctCount / mastery.totalCount) * 100)
        : null,
      totalCount: mastery?.totalCount ?? 0,
    };
  });

  const assignmentsForClasses = await db.query.assignments.findMany({
    where: and(inArray(assignments.classId, sharedClassIds), eq(assignments.status, "published")),
  });
  const assignmentIds = assignmentsForClasses.map((assignment) => assignment.id);

  const submissions = assignmentIds.length > 0
    ? await db.query.assignmentSubmissions.findMany({
        where: and(
          eq(assignmentSubmissions.studentId, studentId),
          inArray(assignmentSubmissions.assignmentId, assignmentIds),
        ),
      })
    : [];
  const submissionByAssignmentId = new Map(submissions.map((s) => [s.assignmentId, s]));

  const assignmentHistory = assignmentsForClasses.map((assignment) => {
    const submission = submissionByAssignmentId.get(assignment.id);
    return {
      assignmentId: assignment.id,
      title: assignment.title,
      className: classNameById.get(assignment.classId) ?? "",
      status: submission?.status ?? ("not_started" as const),
      score: submission?.score ?? null,
      totalPoints: assignment.totalPoints,
    };
  });

  return {
    userId: studentId,
    userName: progress?.userName ?? "Student",
    userImageSrc: progress?.userImageSrc ?? "/mascot.svg",
    points: progress?.points ?? 0,
    currentStreak: streak?.currentStreak ?? 0,
    classes: sharedClasses.map((classRecord) => ({ id: classRecord.id, name: classRecord.name })),
    conceptMastery: conceptMasteryList,
    assignmentHistory,
  };
});

export const getMisconceptionCandidates = cache(async (classId: number) => {
  const course = await db.query.courses.findFirst({
    where: eq(courses.classId, classId),
  });

  if (!course) {
    return [];
  }

  const enrollments = await db.query.classEnrollments.findMany({
    where: eq(classEnrollments.classId, classId),
  });
  const studentIds = enrollments.map((enrollment) => enrollment.studentId);

  if (studentIds.length === 0) {
    return [];
  }

  const conceptRows = await db.query.concepts.findMany({
    where: eq(concepts.courseId, course.id),
  });
  const conceptIds = conceptRows.map((concept) => concept.id);

  if (conceptIds.length === 0) {
    return [];
  }

  const challengeRows = await db.query.challenges.findMany({
    where: inArray(challenges.conceptId, conceptIds),
    with: {
      challengeOptions: true,
    },
  });

  const candidates: {
    conceptId: number;
    question: string;
    wrongOptionText: string;
    correctOptionText: string;
    missedByCount: number;
  }[] = [];

  for (const challenge of challengeRows) {
    if (!challenge.conceptId) {
      continue;
    }

    const topWrongOption = await db
      .select({
        selectedOptionId: challengeAttempts.selectedOptionId,
        count: sql<number>`count(*)`,
      })
      .from(challengeAttempts)
      .where(
        and(
          eq(challengeAttempts.challengeId, challenge.id),
          eq(challengeAttempts.correct, false),
          inArray(challengeAttempts.userId, studentIds),
        ),
      )
      .groupBy(challengeAttempts.selectedOptionId)
      .orderBy(desc(sql`count(*)`))
      .limit(1);

    if (topWrongOption.length === 0 || topWrongOption[0].count < 2) {
      continue;
    }

    const wrongOption = challenge.challengeOptions.find(
      (option) => option.id === topWrongOption[0].selectedOptionId,
    );
    const correctOption = challenge.challengeOptions.find((option) => option.correct);

    if (!wrongOption || !correctOption) {
      continue;
    }

    candidates.push({
      conceptId: challenge.conceptId,
      question: challenge.question,
      wrongOptionText: wrongOption.text,
      correctOptionText: correctOption.text,
      missedByCount: topWrongOption[0].count,
    });
  }

  return candidates;
});

export const getUserStreak = cache(async () => {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  const streak = await db.query.streaks.findFirst({
    where: eq(streaks.userId, userId),
  });

  return streak ?? { userId, currentStreak: 0, longestStreak: 0, lastActiveDate: null };
});

export const getAchievementsWithStatus = cache(async () => {
  const { userId } = await auth();

  const allAchievements = await db.query.achievements.findMany({
    orderBy: (achievements, { asc }) => [asc(achievements.id)],
  });

  const unlocked = userId
    ? await db.query.userAchievements.findMany({
        where: eq(userAchievements.userId, userId),
      })
    : [];
  const unlockedAtByAchievementId = new Map(
    unlocked.map((row) => [row.achievementId, row.unlockedAt]),
  );

  return allAchievements.map((achievement) => ({
    ...achievement,
    unlockedAt: unlockedAtByAchievementId.get(achievement.id) ?? null,
  }));
});

export const getStudentConceptMastery = cache(async () => {
  const { userId } = await auth();

  if (!userId) {
    return [];
  }

  const enrollments = await db.query.classEnrollments.findMany({
    where: eq(classEnrollments.studentId, userId),
  });
  const classIds = enrollments.map((enrollment) => enrollment.classId);

  if (classIds.length === 0) {
    return [];
  }

  const enrolledCourses = await db.query.courses.findMany({
    where: inArray(courses.classId, classIds),
  });
  const courseIds = enrolledCourses.map((course) => course.id);

  if (courseIds.length === 0) {
    return [];
  }

  const conceptRows = await db.query.concepts.findMany({
    where: inArray(concepts.courseId, courseIds),
  });
  const conceptIds = conceptRows.map((concept) => concept.id);

  if (conceptIds.length === 0) {
    return [];
  }

  const masteryRows = await db.query.conceptMastery.findMany({
    where: and(eq(conceptMastery.userId, userId), inArray(conceptMastery.conceptId, conceptIds)),
  });
  const masteryByConceptId = new Map(masteryRows.map((row) => [row.conceptId, row]));

  return conceptRows.map((concept) => {
    const mastery = masteryByConceptId.get(concept.id);
    const masteryPct = mastery && mastery.totalCount > 0
      ? Math.round((mastery.correctCount / mastery.totalCount) * 100)
      : null;

    return {
      conceptId: concept.id,
      title: concept.title,
      masteryPct,
      totalCount: mastery?.totalCount ?? 0,
    };
  });
});

export const getStudentFlashcards = cache(async () => {
  const { userId } = await auth();

  if (!userId) {
    return [];
  }

  const enrollments = await db.query.classEnrollments.findMany({
    where: eq(classEnrollments.studentId, userId),
  });
  const classIds = enrollments.map((enrollment) => enrollment.classId);

  if (classIds.length === 0) {
    return [];
  }

  const enrolledCourses = await db.query.courses.findMany({
    where: inArray(courses.classId, classIds),
  });
  const courseIds = enrolledCourses.map((course) => course.id);

  if (courseIds.length === 0) {
    return [];
  }

  const conceptRows = await db.query.concepts.findMany({
    where: inArray(concepts.courseId, courseIds),
    with: {
      flashcards: true,
    },
  });

  return conceptRows.flatMap((concept) =>
    concept.flashcards.map((flashcard) => ({
      id: flashcard.id,
      front: flashcard.front,
      back: flashcard.back,
      conceptTitle: concept.title,
    })),
  );
});

// --- Assignments ---

export const getAssignmentsForTeacher = cache(async () => {
  const { userId } = await auth();

  if (!userId) {
    return [];
  }

  const teacherClasses = await db.query.classes.findMany({
    where: eq(classes.teacherId, userId),
    with: { enrollments: true },
  });
  const classIds = teacherClasses.map((classRecord) => classRecord.id);

  if (classIds.length === 0) {
    return [];
  }

  const classById = new Map(teacherClasses.map((classRecord) => [classRecord.id, classRecord]));

  const rows = await db.query.assignments.findMany({
    where: inArray(assignments.classId, classIds),
    orderBy: (assignments, { desc }) => [desc(assignments.createdAt)],
    with: { submissions: true },
  });

  return rows.map((assignment) => {
    const classRecord = classById.get(assignment.classId);

    return {
      id: assignment.id,
      classId: assignment.classId,
      className: classRecord?.name ?? "",
      title: assignment.title,
      type: assignment.type,
      status: assignment.status,
      totalPoints: assignment.totalPoints,
      dueAt: assignment.dueAt,
      enrolledCount: classRecord?.enrollments.length ?? 0,
      submittedCount: assignment.submissions.filter((s) => s.status !== "not_started").length,
      gradedCount: assignment.submissions.filter((s) => s.status === "graded").length,
    };
  });
});

export const getAssignmentForTeacher = cache(async (assignmentId: number) => {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  const assignment = await db.query.assignments.findFirst({
    where: eq(assignments.id, assignmentId),
    with: { class: true },
  });

  if (!assignment || assignment.class.teacherId !== userId) {
    return null;
  }

  const enrollments = await db.query.classEnrollments.findMany({
    where: eq(classEnrollments.classId, assignment.classId),
  });
  const studentIds = enrollments.map((enrollment) => enrollment.studentId);

  const submissionRows = studentIds.length > 0
    ? await db.query.assignmentSubmissions.findMany({
        where: and(
          eq(assignmentSubmissions.assignmentId, assignmentId),
          inArray(assignmentSubmissions.studentId, studentIds),
        ),
      })
    : [];
  const submissionByStudentId = new Map(submissionRows.map((s) => [s.studentId, s]));

  const progressRows = studentIds.length > 0
    ? await db.query.userProgress.findMany({
        where: inArray(userProgress.userId, studentIds),
      })
    : [];
  const nameByUserId = new Map(progressRows.map((p) => [p.userId, p.userName]));

  const roster = studentIds.map((studentId) => {
    const submission = submissionByStudentId.get(studentId);

    return {
      studentId,
      studentName: nameByUserId.get(studentId) ?? "Student",
      submissionId: submission?.id ?? null,
      status: submission?.status ?? ("not_started" as const),
      responseText: submission?.responseText ?? null,
      score: submission?.score ?? null,
      feedback: submission?.feedback ?? null,
      submittedAt: submission?.submittedAt ?? null,
    };
  });

  return {
    id: assignment.id,
    classId: assignment.classId,
    className: assignment.class.name,
    title: assignment.title,
    description: assignment.description,
    type: assignment.type,
    status: assignment.status,
    totalPoints: assignment.totalPoints,
    dueAt: assignment.dueAt,
    roster,
  };
});

export const getAssignmentsForStudent = cache(async () => {
  const { userId } = await auth();

  if (!userId) {
    return [];
  }

  const enrollments = await db.query.classEnrollments.findMany({
    where: eq(classEnrollments.studentId, userId),
    with: { class: true },
  });
  const classIds = enrollments.map((enrollment) => enrollment.classId);

  if (classIds.length === 0) {
    return [];
  }

  const classNameByClassId = new Map(
    enrollments.map((enrollment) => [enrollment.classId, enrollment.class.name]),
  );

  const rows = await db.query.assignments.findMany({
    where: and(inArray(assignments.classId, classIds), eq(assignments.status, "published")),
    orderBy: (assignments, { asc }) => [asc(assignments.dueAt)],
    with: {
      submissions: {
        where: eq(assignmentSubmissions.studentId, userId),
      },
    },
  });

  return rows.map((assignment) => ({
    id: assignment.id,
    className: classNameByClassId.get(assignment.classId) ?? "",
    title: assignment.title,
    type: assignment.type,
    totalPoints: assignment.totalPoints,
    dueAt: assignment.dueAt,
    status: assignment.submissions[0]?.status ?? ("not_started" as const),
    score: assignment.submissions[0]?.score ?? null,
  }));
});

export const getStudentAssignment = cache(async (assignmentId: number) => {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  const assignment = await db.query.assignments.findFirst({
    where: and(eq(assignments.id, assignmentId), eq(assignments.status, "published")),
    with: {
      class: true,
      submissions: {
        where: eq(assignmentSubmissions.studentId, userId),
      },
    },
  });

  if (!assignment) {
    return null;
  }

  const enrolled = await isEnrolledIn(assignment.classId);

  if (!enrolled) {
    return null;
  }

  return {
    id: assignment.id,
    className: assignment.class.name,
    title: assignment.title,
    description: assignment.description,
    type: assignment.type,
    totalPoints: assignment.totalPoints,
    dueAt: assignment.dueAt,
    submission: assignment.submissions[0] ?? null,
  };
});
