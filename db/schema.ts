import { relations, sql } from "drizzle-orm";
import { integer, sqliteTable, text, unique } from "drizzle-orm/sqlite-core";

export const courses = sqliteTable("courses", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  imageSrc: text("image_src").notNull(),
  // Null for the original global catalog courses; set for AI-generated,
  // teacher-owned courses scoped to a class. Unique because every dashboard
  // query assumes exactly one course per class via findFirst — SQLite, like
  // Postgres, allows multiple NULLs under a unique constraint, so this only
  // guards the non-null, class-scoped case.
  classId: integer("class_id").references(() => classes.id, { onDelete: "cascade" }).unique(),
});

export const coursesRelations = relations(courses, ({ many, one }) => ({
  userProgress: many(userProgress),
  units: many(units),
  class: one(classes, {
    fields: [courses.classId],
    references: [classes.id],
  }),
}));

export const units = sqliteTable("units", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(), // Unit 1
  description: text("description").notNull(), // Learn the basics of spanish
  courseId: integer("course_id").references(() => courses.id, { onDelete: "cascade" }).notNull(),
  order: integer("order").notNull(),
});

export const unitsRelations = relations(units, ({ many, one }) => ({
  course: one(courses, {
    fields: [units.courseId],
    references: [courses.id],
  }),
  lessons: many(lessons),
}));

export const lessons = sqliteTable("lessons", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  unitId: integer("unit_id").references(() => units.id, { onDelete: "cascade" }).notNull(),
  order: integer("order").notNull(),
});

export const lessonsRelations = relations(lessons, ({ one, many }) => ({
  unit: one(units, {
    fields: [lessons.unitId],
    references: [units.id],
  }),
  challenges: many(challenges),
}));

export const challenges = sqliteTable("challenges", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  lessonId: integer("lesson_id").references(() => lessons.id, { onDelete: "cascade" }).notNull(),
  type: text("type", { enum: ["SELECT", "ASSIST"] }).notNull(),
  question: text("question").notNull(),
  order: integer("order").notNull(),
  // Which concept this question tests. Null for hand-authored legacy content;
  // set for AI-generated questions so mastery can be tracked per concept.
  conceptId: integer("concept_id").references(() => concepts.id, { onDelete: "set null" }),
});

export const challengesRelations = relations(challenges, ({ one, many }) => ({
  lesson: one(lessons, {
    fields: [challenges.lessonId],
    references: [lessons.id],
  }),
  concept: one(concepts, {
    fields: [challenges.conceptId],
    references: [concepts.id],
  }),
  challengeOptions: many(challengeOptions),
  challengeProgress: many(challengeProgress),
}));

export const challengeOptions = sqliteTable("challenge_options", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  challengeId: integer("challenge_id").references(() => challenges.id, { onDelete: "cascade" }).notNull(),
  text: text("text").notNull(),
  correct: integer("correct", { mode: "boolean" }).notNull(),
  imageSrc: text("image_src"),
  audioSrc: text("audio_src"),
});

export const challengeOptionsRelations = relations(challengeOptions, ({ one }) => ({
  challenge: one(challenges, {
    fields: [challengeOptions.challengeId],
    references: [challenges.id],
  }),
}));

export const challengeProgress = sqliteTable("challenge_progress", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull(),
  challengeId: integer("challenge_id").references(() => challenges.id, { onDelete: "cascade" }).notNull(),
  completed: integer("completed", { mode: "boolean" }).notNull().default(false),
});

export const challengeProgressRelations = relations(challengeProgress, ({ one }) => ({
  challenge: one(challenges, {
    fields: [challengeProgress.challengeId],
    references: [challenges.id],
  }),
}));

export const userProgress = sqliteTable("user_progress", {
  userId: text("user_id").primaryKey(),
  userName: text("user_name").notNull().default("User"),
  userImageSrc: text("user_image_src").notNull().default("/mascot.svg"),
  activeCourseId: integer("active_course_id").references(() => courses.id, { onDelete: "cascade" }),
  hearts: integer("hearts").notNull().default(5),
  points: integer("points").notNull().default(0),
});

export const userProgressRelations = relations(userProgress, ({ one }) => ({
  activeCourse: one(courses, {
    fields: [userProgress.activeCourseId],
    references: [courses.id],
  }),
}));

export const userSubscription = sqliteTable("user_subscription", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull().unique(),
  stripeCustomerId: text("stripe_customer_id").notNull().unique(),
  stripeSubscriptionId: text("stripe_subscription_id").notNull().unique(),
  stripePriceId: text("stripe_price_id").notNull(),
  stripeCurrentPeriodEnd: integer("stripe_current_period_end", { mode: "timestamp" }).notNull(),
});

// --- Classes (teacher/student model) ---
// Role itself lives in Clerk publicMetadata (see lib/roles.ts), not here —
// it needs to exist before any DB row does, right after sign-up.

export const classes = sqliteTable("classes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  teacherId: text("teacher_id").notNull(),
  name: text("name").notNull(),
  joinCode: text("join_code").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export const classesRelations = relations(classes, ({ many }) => ({
  enrollments: many(classEnrollments),
  courses: many(courses),
  sourceDocuments: many(sourceDocuments),
  assignments: many(assignments),
}));

export const classEnrollments = sqliteTable("class_enrollments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  classId: integer("class_id").references(() => classes.id, { onDelete: "cascade" }).notNull(),
  studentId: text("student_id").notNull(),
  enrolledAt: integer("enrolled_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
}, (table) => ({
  uniqueEnrollment: unique().on(table.classId, table.studentId),
}));

export const classEnrollmentsRelations = relations(classEnrollments, ({ one }) => ({
  class: one(classes, {
    fields: [classEnrollments.classId],
    references: [classes.id],
  }),
}));

// --- Assignments (homework/quiz/exam, manually graded) ---
// "type" is a label for the teacher's own organization only — every type
// shares the same shape (a deadline plus a text response to grade). Auto-
// grading against the existing challenge/quiz engine is a separate,
// later piece of work, not this table's job.

export const assignments = sqliteTable("assignments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  classId: integer("class_id").references(() => classes.id, { onDelete: "cascade" }).notNull(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  type: text("type", { enum: ["homework", "quiz", "exam"] }).notNull().default("homework"),
  status: text("status", { enum: ["draft", "published"] }).notNull().default("draft"),
  totalPoints: integer("total_points").notNull().default(100),
  dueAt: integer("due_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export const assignmentsRelations = relations(assignments, ({ one, many }) => ({
  class: one(classes, {
    fields: [assignments.classId],
    references: [classes.id],
  }),
  submissions: many(assignmentSubmissions),
}));

export const assignmentSubmissions = sqliteTable("assignment_submissions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  assignmentId: integer("assignment_id").references(() => assignments.id, { onDelete: "cascade" }).notNull(),
  studentId: text("student_id").notNull(),
  status: text("status", { enum: ["not_started", "submitted", "graded"] }).notNull().default("not_started"),
  responseText: text("response_text"),
  score: integer("score"),
  feedback: text("feedback"),
  submittedAt: integer("submitted_at", { mode: "timestamp" }),
  gradedAt: integer("graded_at", { mode: "timestamp" }),
}, (table) => ({
  uniqueSubmission: unique().on(table.assignmentId, table.studentId),
}));

export const assignmentSubmissionsRelations = relations(assignmentSubmissions, ({ one }) => ({
  assignment: one(assignments, {
    fields: [assignmentSubmissions.assignmentId],
    references: [assignments.id],
  }),
}));

// --- AI content pipeline ---

export const sourceDocuments = sqliteTable("source_documents", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  teacherId: text("teacher_id").notNull(),
  classId: integer("class_id").references(() => classes.id, { onDelete: "cascade" }).notNull(),
  title: text("title").notNull(),
  type: text("type", { enum: ["pdf", "youtube", "text"] }).notNull(),
  rawText: text("raw_text").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export const sourceDocumentsRelations = relations(sourceDocuments, ({ one, many }) => ({
  class: one(classes, {
    fields: [sourceDocuments.classId],
    references: [classes.id],
  }),
  concepts: many(concepts),
}));

export const concepts = sqliteTable("concepts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  courseId: integer("course_id").references(() => courses.id, { onDelete: "cascade" }).notNull(),
  sourceDocumentId: integer("source_document_id").references(() => sourceDocuments.id, { onDelete: "set null" }),
  title: text("title").notNull(),
});

export const conceptsRelations = relations(concepts, ({ one, many }) => ({
  course: one(courses, {
    fields: [concepts.courseId],
    references: [courses.id],
  }),
  sourceDocument: one(sourceDocuments, {
    fields: [concepts.sourceDocumentId],
    references: [sourceDocuments.id],
  }),
  challenges: many(challenges),
  mastery: many(conceptMastery),
  flashcards: many(flashcards),
}));

// Running per-student, per-concept mastery — updated alongside challengeProgress
// on every answer instead of being derived on read, so the teacher dashboard
// (Phase 3) can query it directly without expensive joins.
export const conceptMastery = sqliteTable("concept_mastery", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull(),
  conceptId: integer("concept_id").references(() => concepts.id, { onDelete: "cascade" }).notNull(),
  correctCount: integer("correct_count").notNull().default(0),
  totalCount: integer("total_count").notNull().default(0),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
}, (table) => ({
  uniqueUserConcept: unique().on(table.userId, table.conceptId),
}));

export const conceptMasteryRelations = relations(conceptMastery, ({ one }) => ({
  concept: one(concepts, {
    fields: [conceptMastery.conceptId],
    references: [concepts.id],
  }),
}));

// Every answer attempt, right or wrong — challengeProgress only records
// completion, not which option was picked, so misconception clustering
// (which wrong option students commonly pick) needs this separately.
export const challengeAttempts = sqliteTable("challenge_attempts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull(),
  challengeId: integer("challenge_id").references(() => challenges.id, { onDelete: "cascade" }).notNull(),
  selectedOptionId: integer("selected_option_id").references(() => challengeOptions.id, { onDelete: "cascade" }).notNull(),
  correct: integer("correct", { mode: "boolean" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export const challengeAttemptsRelations = relations(challengeAttempts, ({ one }) => ({
  challenge: one(challenges, {
    fields: [challengeAttempts.challengeId],
    references: [challenges.id],
  }),
  selectedOption: one(challengeOptions, {
    fields: [challengeAttempts.selectedOptionId],
    references: [challengeOptions.id],
  }),
}));

export const flashcards = sqliteTable("flashcards", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  conceptId: integer("concept_id").references(() => concepts.id, { onDelete: "cascade" }).notNull(),
  front: text("front").notNull(),
  back: text("back").notNull(),
});

export const flashcardsRelations = relations(flashcards, ({ one }) => ({
  concept: one(concepts, {
    fields: [flashcards.conceptId],
    references: [concepts.id],
  }),
}));

// --- Gamification ---

export const streaks = sqliteTable("streaks", {
  userId: text("user_id").primaryKey(),
  currentStreak: integer("current_streak").notNull().default(0),
  longestStreak: integer("longest_streak").notNull().default(0),
  // Plain YYYY-MM-DD text (SQLite has no native date type) so "same day"
  // comparisons don't depend on time-of-day or timezone math — just string
  // equality, exactly as it was under Postgres's string-mode `date` column.
  lastActiveDate: text("last_active_date"),
});

export const achievements = sqliteTable("achievements", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  key: text("key").notNull().unique(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  iconSrc: text("icon_src").notNull(),
});

export const achievementsRelations = relations(achievements, ({ many }) => ({
  unlocks: many(userAchievements),
}));

export const userAchievements = sqliteTable("user_achievements", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull(),
  achievementId: integer("achievement_id").references(() => achievements.id, { onDelete: "cascade" }).notNull(),
  unlockedAt: integer("unlocked_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
}, (table) => ({
  uniqueUnlock: unique().on(table.userId, table.achievementId),
}));

export const userAchievementsRelations = relations(userAchievements, ({ one }) => ({
  achievement: one(achievements, {
    fields: [userAchievements.achievementId],
    references: [achievements.id],
  }),
}));
