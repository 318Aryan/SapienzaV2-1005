import Image from "next/image";
import { notFound } from "next/navigation";
import { CheckCircle2, Flame, TrendingUp, Zap } from "lucide-react";

import { StatCard } from "@/components/stat-card";
import { StatusPill } from "@/components/status-pill";
import { cn } from "@/lib/utils";
import { getStudentProfileForTeacher } from "@/db/queries";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const masteryColor = (pct: number | null) => {
  if (pct === null) return "bg-neutral-200";
  if (pct < 50) return "bg-rose-500";
  if (pct < 75) return "bg-amber-500";
  return "bg-green-500";
};

const STATUS_TONE = {
  not_started: "neutral",
  submitted: "sky",
  graded: "green",
} as const;

const STATUS_LABEL = {
  not_started: "Not submitted",
  submitted: "Submitted",
  graded: "Graded",
} as const;

type Props = {
  params: { studentId: string };
};

const TeacherStudentProfilePage = async ({ params }: Props) => {
  const student = await getStudentProfileForTeacher(params.studentId);

  if (!student) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-y-8 px-3">
      <div className="border-2 border-b-4 rounded-xl p-5 flex items-center gap-x-4 flex-wrap">
        <Image
          src={student.userImageSrc}
          alt={student.userName}
          height={56}
          width={56}
          className="rounded-full border object-cover"
        />
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-neutral-700">{student.userName}</h1>
          <div className="flex flex-wrap gap-1 mt-1">
            {student.classes.map((classRecord) => (
              <StatusPill key={classRecord.id} tone="neutral">{classRecord.name}</StatusPill>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon={Zap} label="Total XP" value={student.points} tone="sky" />
        <StatCard icon={Flame} label="Day streak" value={student.currentStreak} tone="amber" />
        <StatCard
          icon={CheckCircle2}
          label="Assignments graded"
          value={student.assignmentHistory.filter((a) => a.status === "graded").length}
          tone="green"
        />
        <StatCard
          icon={TrendingUp}
          label="Concepts tracked"
          value={student.conceptMastery.length}
          tone="indigo"
        />
      </div>

      <section className="flex flex-col gap-y-4">
        <h2 className="text-lg font-bold text-neutral-700">Concept mastery</h2>
        {student.conceptMastery.length === 0 ? (
          <div className="border-2 border-b-4 rounded-xl p-4">
            <p className="text-sm text-neutral-500">No concepts tracked yet.</p>
          </div>
        ) : (
          <div className="border-2 border-b-4 rounded-xl p-4 flex flex-col gap-y-5">
            {student.conceptMastery.map((concept) => (
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
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-y-4">
        <h2 className="text-lg font-bold text-neutral-700">Assignment history</h2>
        {student.assignmentHistory.length === 0 ? (
          <div className="border-2 border-b-4 rounded-xl p-4">
            <p className="text-sm text-neutral-500">No published assignments yet.</p>
          </div>
        ) : (
          <div className="border-2 border-b-4 rounded-xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Assignment</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {student.assignmentHistory.map((assignment) => (
                  <TableRow key={assignment.assignmentId}>
                    <TableCell className="font-medium text-neutral-700">{assignment.title}</TableCell>
                    <TableCell>{assignment.className}</TableCell>
                    <TableCell>
                      <StatusPill tone={STATUS_TONE[assignment.status]}>
                        {STATUS_LABEL[assignment.status]}
                      </StatusPill>
                    </TableCell>
                    <TableCell>
                      {assignment.score === null ? "—" : `${assignment.score}/${assignment.totalPoints}`}
                    </TableCell>
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

export default TeacherStudentProfilePage;
