import Link from "next/link";
import { Users } from "lucide-react";

import { StatusPill } from "@/components/status-pill";
import { getStudentsForTeacher } from "@/db/queries";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const masteryTone = (pct: number | null) => {
  if (pct === null) return "neutral" as const;
  if (pct < 50) return "rose" as const;
  if (pct < 75) return "amber" as const;
  return "green" as const;
};

const TeacherStudentsPage = async () => {
  const students = await getStudentsForTeacher();

  return (
    <div className="flex flex-col gap-y-8 px-3">
      <h1 className="text-2xl font-bold text-neutral-700">Students</h1>

      {students.length === 0 ? (
        <div className="border-2 border-dashed rounded-xl p-6 flex flex-col items-center gap-y-2 text-center">
          <Users className="h-8 w-8 text-neutral-400" />
          <p className="text-neutral-500 text-sm">
            No students yet — share a class join code to get your first one.
          </p>
        </div>
      ) : (
        <div className="border-2 border-b-4 rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Classes</TableHead>
                <TableHead>Mastery</TableHead>
                <TableHead>Assignments</TableHead>
                <TableHead>XP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student) => (
                <TableRow key={student.userId}>
                  <TableCell className="font-medium text-neutral-700">
                    <Link href={`/teacher/students/${student.userId}`} className="hover:underline">
                      {student.userName}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {student.classNames.map((name) => (
                        <StatusPill key={name} tone="neutral">{name}</StatusPill>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusPill tone={masteryTone(student.masteryPct)}>
                      {student.masteryPct === null ? "No attempts yet" : `${student.masteryPct}%`}
                    </StatusPill>
                  </TableCell>
                  <TableCell>
                    {student.assignmentsGraded}/{student.assignmentsSubmitted} graded
                  </TableCell>
                  <TableCell>{student.points}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default TeacherStudentsPage;
