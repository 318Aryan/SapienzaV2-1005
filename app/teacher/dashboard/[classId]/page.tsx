import Link from "next/link";
import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { Users } from "lucide-react";

import db from "@/db/drizzle";
import { assignments as assignmentsTable, classes } from "@/db/schema";
import {
  getAtRiskStudents,
  getClassConceptMastery,
  getMisconceptionCandidates,
  getTeacherUploadCounts,
  getUserSubscription,
} from "@/db/queries";
import { explainMisconceptions } from "@/lib/ai";
import { isClassTeacher } from "@/lib/roles";
import { cn } from "@/lib/utils";
import { StatusPill } from "@/components/status-pill";
import { WEAK_MASTERY_THRESHOLD, FREE_TIER_LIMITS } from "@/constants";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { RevisionQuizButton } from "./revision-quiz-button";
import { UploadMaterialForm } from "./upload-material-form";

const masteryColor = (pct: number | null) => {
  if (pct === null) return "bg-neutral-200";
  if (pct < 50) return "bg-rose-500";
  if (pct < 75) return "bg-amber-500";
  return "bg-green-500";
};

type Props = {
  params: { classId: string };
};

const TeacherDashboardPage = async ({ params }: Props) => {
  const classId = Number(params.classId);

  if (!classId || Number.isNaN(classId)) {
    notFound();
  }

  const isTeacher = await isClassTeacher(classId);

  if (!isTeacher) {
    redirect("/teacher/classes");
  }

  const classRecord = await db.query.classes.findFirst({
    where: eq(classes.id, classId),
    with: { enrollments: true },
  });

  if (!classRecord) {
    notFound();
  }

  const [mastery, atRisk, misconceptionCandidates, subscription, uploadCounts, classAssignments] = await Promise.all([
    getClassConceptMastery(classId),
    getAtRiskStudents(classId),
    getMisconceptionCandidates(classId),
    getUserSubscription(),
    getTeacherUploadCounts(),
    db.query.assignments.findMany({ where: eq(assignmentsTable.classId, classId) }),
  ]);

  const isPro = !!subscription?.isActive;
  const uploadsUsed = uploadCounts.get(classId) ?? 0;
  const assignmentsUsed = classAssignments.length;

  const misconceptions = await explainMisconceptions(misconceptionCandidates);
  const explanationByConceptId = new Map(
    misconceptions.map((misconception) => [misconception.conceptId, misconception.explanation]),
  );

  const weakConceptTitles = mastery
    .filter((concept) => concept.masteryPct !== null && concept.masteryPct < WEAK_MASTERY_THRESHOLD)
    .map((concept) => concept.title);

  return (
    <div className="flex flex-col gap-y-8 px-3">
      <div>
        <h1 className="text-2xl font-bold text-neutral-700">{classRecord.name}</h1>
        <div className="mt-1 flex items-center gap-x-4 flex-wrap">
          <p className="flex items-center gap-x-1.5 text-sm text-neutral-500">
            <Users className="h-4 w-4" />
            {classRecord.enrollments.length} student{classRecord.enrollments.length === 1 ? "" : "s"}
          </p>
          {!isPro && (
            <>
              <StatusPill tone={uploadsUsed >= FREE_TIER_LIMITS.maxUploadsPerClass ? "rose" : "neutral"}>
                {uploadsUsed}/{FREE_TIER_LIMITS.maxUploadsPerClass} uploads
              </StatusPill>
              <StatusPill tone={assignmentsUsed >= FREE_TIER_LIMITS.maxAssignmentsPerClass ? "rose" : "neutral"}>
                {assignmentsUsed}/{FREE_TIER_LIMITS.maxAssignmentsPerClass} assignments
              </StatusPill>
            </>
          )}
        </div>
      </div>

      <UploadMaterialForm classId={classId} />

      <RevisionQuizButton classId={classId} weakConceptTitles={weakConceptTitles} />

      <section className="flex flex-col gap-y-4">
        <h2 className="text-lg font-bold text-neutral-700">Concept mastery</h2>
        {mastery.length === 0 ? (
          <div className="border-2 border-b-4 rounded-xl p-4">
            <p className="text-sm text-neutral-500">
              No concepts yet — upload material to generate a quiz.
            </p>
          </div>
        ) : (
          <div className="border-2 border-b-4 rounded-xl p-4 flex flex-col gap-y-5">
            {mastery.map((concept) => (
              <div key={concept.conceptId} className="flex flex-col gap-y-1.5">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-medium text-neutral-700">{concept.title}</span>
                  <span className="text-sm font-bold text-neutral-700">
                    {concept.masteryPct === null ? "—" : `${concept.masteryPct}%`}
                  </span>
                </div>
                <div className="h-3 w-full rounded-full bg-neutral-100">
                  <div
                    className={cn("h-full rounded-full transition-all", masteryColor(concept.masteryPct))}
                    style={{ width: `${concept.masteryPct ?? 0}%` }}
                  />
                </div>
                {explanationByConceptId.has(concept.conceptId) && (
                  <p className="mt-1 rounded-md bg-amber-100 px-2.5 py-1.5 text-sm text-amber-700">
                    {explanationByConceptId.get(concept.conceptId)}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-y-4">
        <h2 className="text-lg font-bold text-neutral-700">Students</h2>
        {atRisk.length === 0 ? (
          <div className="border-2 border-b-4 rounded-xl p-4">
            <p className="text-sm text-neutral-500">No students enrolled yet — share the join code.</p>
          </div>
        ) : (
          <div className="border-2 border-b-4 rounded-xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Mastery</TableHead>
                  <TableHead>Answers</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {atRisk.map((student) => (
                  <TableRow key={student.userId}>
                    <TableCell className="font-medium text-neutral-700">
                      <Link href={`/teacher/students/${student.userId}`} className="hover:underline">
                        {student.userName}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {student.masteryPct === null ? "—" : `${student.masteryPct}%`}
                    </TableCell>
                    <TableCell>{student.totalAnswers}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>
    </div>
  );
};

export default TeacherDashboardPage;
