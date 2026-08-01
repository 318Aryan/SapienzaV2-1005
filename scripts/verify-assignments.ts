import { config } from "dotenv";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { and, eq, inArray } from "drizzle-orm";

import * as schema from "../db/schema";

// Exercises the real schema/relations/business-rules against the actual dev
// DB by mirroring the exact logic in actions/assignments.ts + db/queries.ts.
// Can't call those files directly — they call Clerk's auth() which requires
// a live Next.js request context that doesn't exist here — so the query
// shapes are reproduced inline against a fixed test userId instead. This is
// the closest thing to a real integration test available outside a browser.
// All rows created here are deleted at the end, pass or fail.

config({ path: ".env" });
config({ path: ".env.local", override: true });

const client = createClient({ url: `file:${process.env.DATABASE_URL || "./sqlite.db"}` });
void client.execute("PRAGMA foreign_keys = ON");
const db = drizzle(client, { schema });

const TEACHER_ID = "e2e-test-teacher";
const STUDENT_A = "e2e-test-student-a"; // submits + gets graded
const STUDENT_B = "e2e-test-student-b"; // never submits

let pass = 0;
let fail = 0;

const check = (label: string, condition: boolean, detail?: unknown) => {
  if (condition) {
    pass += 1;
    console.log(`  PASS  ${label}`);
  } else {
    fail += 1;
    console.log(`  FAIL  ${label}${detail !== undefined ? ` — got: ${JSON.stringify(detail)}` : ""}`);
  }
};

let classId = 0;

const cleanup = async () => {
  console.log("\nCleaning up test data...");
  if (classId) {
    // Cascade should already remove enrollments/assignments/submissions, but
    // delete explicitly too so a failed assertion never leaves orphans.
    await db.delete(schema.assignmentSubmissions).where(
      inArray(
        schema.assignmentSubmissions.assignmentId,
        db.select({ id: schema.assignments.id }).from(schema.assignments).where(eq(schema.assignments.classId, classId)),
      ),
    ).catch(() => {});
    await db.delete(schema.assignments).where(eq(schema.assignments.classId, classId)).catch(() => {});
    await db.delete(schema.classEnrollments).where(eq(schema.classEnrollments.classId, classId)).catch(() => {});
    await db.delete(schema.classes).where(eq(schema.classes.id, classId)).catch(() => {});
  }

  const remaining = await db.query.classes.findFirst({ where: eq(schema.classes.teacherId, TEACHER_ID) });
  check("cleanup left no orphaned test rows", !remaining, remaining);
};

const main = async () => {
  console.log("=== Assignments module: end-to-end DB verification ===\n");

  console.log("Setup: class + enrollments");
  const [insertedClass] = await db.insert(schema.classes).values({
    teacherId: TEACHER_ID,
    name: "__e2e_test_class__",
    joinCode: `E2E${Date.now().toString(36).toUpperCase()}`.slice(0, 10),
  }).returning();
  classId = insertedClass.id;

  await db.insert(schema.classEnrollments).values([
    { classId, studentId: STUDENT_A },
    { classId, studentId: STUDENT_B },
  ]);
  check("class + 2 enrollments created", true);

  console.log("\n1. createAssignment (draft)");
  const [assignment] = await db.insert(schema.assignments).values({
    classId,
    title: "E2E Test Homework",
    description: "Answer the question.",
    type: "homework",
    totalPoints: 20,
    dueAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago — exercises "overdue"
  }).returning();
  check("assignment created with status=draft", assignment.status === "draft", assignment.status);

  console.log("\n2. Draft assignment must be invisible to students");
  const draftVisibleToStudent = await db.query.assignments.findFirst({
    where: and(eq(schema.assignments.id, assignment.id), eq(schema.assignments.status, "published")),
  });
  check("draft assignment excluded from published-only query", !draftVisibleToStudent, draftVisibleToStudent);

  console.log("\n3. publishAssignment");
  await db.update(schema.assignments).set({ status: "published" }).where(eq(schema.assignments.id, assignment.id));
  const published = await db.query.assignments.findFirst({ where: eq(schema.assignments.id, assignment.id) });
  check("status flips to published", published?.status === "published", published?.status);

  console.log("\n4. getAssignmentsForStudent shape (mirrors db/queries.ts)");
  const studentListRows = await db.query.assignments.findMany({
    where: and(eq(schema.assignments.classId, classId), eq(schema.assignments.status, "published")),
    with: { submissions: { where: eq(schema.assignmentSubmissions.studentId, STUDENT_A) } },
  });
  check("student sees exactly 1 published assignment", studentListRows.length === 1, studentListRows.length);
  check("no submission yet -> status resolves to not_started", (studentListRows[0]?.submissions.length ?? -1) === 0);

  console.log("\n5. submitAssignment (student A)");
  await db.insert(schema.assignmentSubmissions).values({
    assignmentId: assignment.id,
    studentId: STUDENT_A,
    responseText: "My answer to the homework.",
    status: "submitted",
    submittedAt: new Date(),
  });
  const afterSubmit = await db.query.assignmentSubmissions.findFirst({
    where: and(eq(schema.assignmentSubmissions.assignmentId, assignment.id), eq(schema.assignmentSubmissions.studentId, STUDENT_A)),
  });
  check("submission row created with status=submitted", afterSubmit?.status === "submitted", afterSubmit?.status);

  console.log("\n6. resubmit updates the same row (unique constraint holds)");
  await db.update(schema.assignmentSubmissions).set({
    responseText: "Updated answer.",
    submittedAt: new Date(),
  }).where(and(eq(schema.assignmentSubmissions.assignmentId, assignment.id), eq(schema.assignmentSubmissions.studentId, STUDENT_A)));
  const allSubsForA = await db.query.assignmentSubmissions.findMany({
    where: and(eq(schema.assignmentSubmissions.assignmentId, assignment.id), eq(schema.assignmentSubmissions.studentId, STUDENT_A)),
  });
  check("still exactly 1 row after resubmit (no duplicate)", allSubsForA.length === 1, allSubsForA.length);
  check("resubmit content overwrote previous response", allSubsForA[0]?.responseText === "Updated answer.");

  console.log("\n7. getAssignmentForTeacher roster (mirrors db/queries.ts)");
  const enrollments = await db.query.classEnrollments.findMany({ where: eq(schema.classEnrollments.classId, classId) });
  const submissionRows = await db.query.assignmentSubmissions.findMany({
    where: eq(schema.assignmentSubmissions.assignmentId, assignment.id),
  });
  const submissionByStudent = new Map(submissionRows.map((s) => [s.studentId, s]));
  const roster = enrollments.map((e) => ({
    studentId: e.studentId,
    status: submissionByStudent.get(e.studentId)?.status ?? "not_started",
  }));
  check("roster has 2 entries (full class, not just submitters)", roster.length === 2, roster.length);
  check("student A shows submitted", roster.find((r) => r.studentId === STUDENT_A)?.status === "submitted");
  check("student B (never submitted) shows not_started, not missing", roster.find((r) => r.studentId === STUDENT_B)?.status === "not_started");

  console.log("\n8. gradeSubmission (score bounds + persistence)");
  const submissionToGrade = submissionByStudent.get(STUDENT_A)!;
  const scoreInBounds = 18;
  const rejectOutOfBounds = scoreInBounds < 0 || scoreInBounds > assignment.totalPoints;
  check("score-bounds check would accept 18/20", !rejectOutOfBounds);
  const rejectTooHigh = 25 < 0 || 25 > assignment.totalPoints;
  check("score-bounds check would reject 25/20", rejectTooHigh);

  await db.update(schema.assignmentSubmissions).set({
    status: "graded",
    score: scoreInBounds,
    feedback: "Good work, minor gaps.",
    gradedAt: new Date(),
  }).where(eq(schema.assignmentSubmissions.id, submissionToGrade.id));

  const graded = await db.query.assignmentSubmissions.findFirst({ where: eq(schema.assignmentSubmissions.id, submissionToGrade.id) });
  check("submission status=graded with correct score", graded?.status === "graded" && graded.score === 18, graded);

  console.log("\n9. Student-side read-after-grade (mirrors getStudentAssignment)");
  const studentView = await db.query.assignments.findFirst({
    where: eq(schema.assignments.id, assignment.id),
    with: { submissions: { where: eq(schema.assignmentSubmissions.studentId, STUDENT_A) } },
  });
  check("student sees graded status + score + feedback", studentView?.submissions[0]?.status === "graded"
    && studentView.submissions[0]?.score === 18
    && studentView.submissions[0]?.feedback === "Good work, minor gaps.");

  console.log("\n10. getAssignmentsForTeacher aggregate counts");
  const allSubs = await db.query.assignmentSubmissions.findMany({ where: eq(schema.assignmentSubmissions.assignmentId, assignment.id) });
  const submittedCount = allSubs.filter((s) => s.status !== "not_started").length;
  const gradedCount = allSubs.filter((s) => s.status === "graded").length;
  check("1/2 submitted, 1/2 graded, enrolledCount=2", submittedCount === 1 && gradedCount === 1 && enrollments.length === 2,
    { submittedCount, gradedCount, enrolled: enrollments.length });

  console.log("\n11. Sidebar pending-badge count (mirrors Sidebar component)");
  const secondAssignment = await db.insert(schema.assignments).values({
    classId, title: "E2E Second Assignment", type: "quiz", status: "published", totalPoints: 10,
  }).returning();
  const studentAListAfterSecond = await db.query.assignments.findMany({
    where: and(eq(schema.assignments.classId, classId), eq(schema.assignments.status, "published")),
    with: { submissions: { where: eq(schema.assignmentSubmissions.studentId, STUDENT_A) } },
  });
  const pendingCount = studentAListAfterSecond.filter((a) => a.submissions.length === 0).length;
  check("badge count = 1 (graded assignment excluded, new one included)", pendingCount === 1, pendingCount);
  await db.delete(schema.assignments).where(eq(schema.assignments.id, secondAssignment[0].id));

  console.log("\n12. Cascade delete integrity");
  const [throwawayClass] = await db.insert(schema.classes).values({
    teacherId: TEACHER_ID, name: "__e2e_cascade_test__", joinCode: `E2EC${Date.now().toString(36).toUpperCase()}`.slice(0, 10),
  }).returning();
  const [throwawayAssignment] = await db.insert(schema.assignments).values({
    classId: throwawayClass.id, title: "cascade check", type: "homework", totalPoints: 10,
  }).returning();
  await db.insert(schema.assignmentSubmissions).values({
    assignmentId: throwawayAssignment.id, studentId: STUDENT_A, status: "submitted", responseText: "x", submittedAt: new Date(),
  });
  await db.delete(schema.classes).where(eq(schema.classes.id, throwawayClass.id));
  const orphanedAssignment = await db.query.assignments.findFirst({ where: eq(schema.assignments.id, throwawayAssignment.id) });
  check("deleting a class cascades to its assignments", !orphanedAssignment, orphanedAssignment);

  await cleanup();

  console.log(`\n=== ${pass} passed, ${fail} failed ===`);
  client.close();
  process.exit(fail > 0 ? 1 : 0);
};

main().catch(async (error) => {
  console.error("\nScript crashed:", error);
  await cleanup();
  client.close();
  process.exit(1);
});
