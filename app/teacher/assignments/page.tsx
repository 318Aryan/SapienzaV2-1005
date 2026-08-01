import Link from "next/link";
import { ClipboardList } from "lucide-react";

import { StatusPill } from "@/components/status-pill";
import { getAssignmentsForTeacher, getClassesByTeacher } from "@/db/queries";
import { TYPE_LABEL } from "@/lib/assignments-ui";

import { CreateAssignmentDialog } from "./create-assignment-dialog";
import { PublishButton } from "./publish-button";

const formatDue = (dueAt: Date | null) => {
  if (!dueAt) return "No due date";
  return new Date(dueAt).toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

const TeacherAssignmentsPage = async () => {
  const classesData = getClassesByTeacher();
  const assignmentsData = getAssignmentsForTeacher();

  const [classes, assignments] = await Promise.all([classesData, assignmentsData]);

  return (
    <div className="flex flex-col gap-y-8 px-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-2xl font-bold text-neutral-700">Assignments</h1>
        <CreateAssignmentDialog
          classes={classes.map((classRecord) => ({ id: classRecord.id, name: classRecord.name }))}
        />
      </div>

      <div className="flex flex-col gap-y-4">
        {assignments.length === 0 ? (
          <div className="border-2 border-dashed rounded-xl p-6 flex flex-col items-center gap-y-2 text-center">
            <ClipboardList className="h-8 w-8 text-neutral-400" />
            <p className="text-neutral-500 text-sm">
              No assignments yet — click &quot;New assignment&quot; to create one.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-y-3">
            {assignments.map((assignment) => (
              <li
                key={assignment.id}
                className="border-2 border-b-4 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between"
              >
                <Link href={`/teacher/assignments/${assignment.id}`} className="flex-1 min-w-0">
                  <div className="flex items-center gap-x-2 flex-wrap">
                    <span className="font-bold text-neutral-700">{assignment.title}</span>
                    <StatusPill tone="sky">{TYPE_LABEL[assignment.type]}</StatusPill>
                    <StatusPill tone={assignment.status === "published" ? "green" : "neutral"}>
                      {assignment.status === "published" ? "Published" : "Draft"}
                    </StatusPill>
                  </div>
                  <p className="text-sm text-neutral-500 mt-1">
                    {assignment.className} · {formatDue(assignment.dueAt)} · {assignment.totalPoints} pts
                  </p>
                  <p className="text-sm text-neutral-500">
                    {assignment.submittedCount}/{assignment.enrolledCount} submitted · {assignment.gradedCount} graded
                  </p>
                </Link>
                {assignment.status === "draft" && (
                  <PublishButton assignmentId={assignment.id} />
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default TeacherAssignmentsPage;
