import { notFound } from "next/navigation";
import { Users } from "lucide-react";

import { StatusPill } from "@/components/status-pill";
import { getAssignmentForTeacher } from "@/db/queries";
import { TYPE_LABEL } from "@/lib/assignments-ui";

import { PublishButton } from "../publish-button";
import { GradeRow } from "./grade-row";

const formatDue = (dueAt: Date | null) => {
  if (!dueAt) return "No due date";
  return new Date(dueAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
};

type Props = {
  params: { assignmentId: string };
};

const TeacherAssignmentDetailPage = async ({ params }: Props) => {
  const assignmentId = Number(params.assignmentId);

  if (!assignmentId || Number.isNaN(assignmentId)) {
    notFound();
  }

  const assignment = await getAssignmentForTeacher(assignmentId);

  if (!assignment) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-y-8 px-3">
      <div>
        <div className="flex items-center gap-x-2 flex-wrap mb-1">
          <h1 className="text-2xl font-bold text-neutral-700">{assignment.title}</h1>
          <StatusPill tone="sky">{TYPE_LABEL[assignment.type]}</StatusPill>
          {assignment.status === "draft" && <PublishButton assignmentId={assignment.id} />}
        </div>
        <p className="text-sm text-neutral-500">
          {assignment.className} · {formatDue(assignment.dueAt)} · {assignment.totalPoints} points
        </p>
        {assignment.description && (
          <p className="text-sm text-neutral-600 mt-3 border-2 border-b-4 rounded-xl p-4">
            {assignment.description}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-y-4">
        <h2 className="text-lg font-bold text-neutral-700 flex items-center gap-x-2">
          <Users className="h-5 w-5" />
          Submissions ({assignment.roster.length})
        </h2>

        {assignment.roster.length === 0 ? (
          <p className="text-sm text-neutral-500">No students enrolled yet.</p>
        ) : (
          <div className="flex flex-col gap-y-3">
            {assignment.roster.map((entry) =>
              entry.submissionId ? (
                <GradeRow
                  key={entry.studentId}
                  submissionId={entry.submissionId}
                  studentName={entry.studentName}
                  status={entry.status}
                  responseText={entry.responseText}
                  score={entry.score}
                  feedback={entry.feedback}
                  totalPoints={assignment.totalPoints}
                />
              ) : (
                <div
                  key={entry.studentId}
                  className="border-2 border-b-4 rounded-xl p-4 flex items-center justify-between"
                >
                  <p className="font-bold text-neutral-700">{entry.studentName}</p>
                  <StatusPill tone="neutral">Not submitted</StatusPill>
                </div>
              ),
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherAssignmentDetailPage;
