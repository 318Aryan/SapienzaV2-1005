import Link from "next/link";
import { AlertCircle, CalendarClock, ClipboardList, CreditCard, GraduationCap, LogIn, Send, TrendingDown, Users } from "lucide-react";

import {
  getAssignmentsForTeacher,
  getClassesByTeacher,
  getRecentActivityForTeacher,
  getStudentsForTeacher,
  getUserSubscription,
} from "@/db/queries";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/stat-card";
import { StatusPill } from "@/components/status-pill";
import { TYPE_LABEL } from "@/lib/assignments-ui";
import { FREE_TIER_LIMITS } from "@/constants";

const formatDue = (dueAt: Date | null) => {
  if (!dueAt) return "No due date";
  return new Date(dueAt).toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

const formatRelativeTime = (date: Date) => {
  const diffMins = Math.floor((Date.now() - date.getTime()) / (1000 * 60));
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

const TeacherOverviewPage = async () => {
  const classesData = getClassesByTeacher();
  const assignmentsData = getAssignmentsForTeacher();
  const subscriptionData = getUserSubscription();
  const studentsData = getStudentsForTeacher();
  const activityData = getRecentActivityForTeacher();

  const [classes, assignments, subscription, students, activity] = await Promise.all([
    classesData,
    assignmentsData,
    subscriptionData,
    studentsData,
    activityData,
  ]);

  // Already sorted worst-first by getStudentsForTeacher — never-attempted
  // (null) students are the most at-risk state, so they lead the list too.
  const studentsNeedingAttention = students
    .filter((s) => s.masteryPct === null || s.masteryPct < 70)
    .slice(0, 5);

  const isPro = !!subscription?.isActive;
  const totalStudents = classes.reduce((sum, classRecord) => sum + classRecord.enrollments.length, 0);

  const assignmentsByClass = new Map<number, number>();
  for (const assignment of assignments) {
    assignmentsByClass.set(assignment.classId, (assignmentsByClass.get(assignment.classId) ?? 0) + 1);
  }

  const needsGrading = assignments
    .filter((a) => a.status === "published" && a.gradedCount < a.submittedCount)
    .sort((a, b) => (b.submittedCount - b.gradedCount) - (a.submittedCount - a.gradedCount));

  const now = Date.now();
  const dueThisWeek = assignments
    .filter((a) => a.status === "published" && a.dueAt && a.dueAt.getTime() >= now && a.dueAt.getTime() - now <= SEVEN_DAYS_MS)
    .sort((a, b) => (a.dueAt?.getTime() ?? 0) - (b.dueAt?.getTime() ?? 0));

  const pendingGradingCount = needsGrading.reduce((sum, a) => sum + (a.submittedCount - a.gradedCount), 0);

  if (classes.length === 0) {
    return (
      <div className="flex flex-col gap-y-8 px-3">
        <h1 className="text-2xl font-bold text-neutral-700">Your classes at a glance</h1>
        <div className="border-2 border-b-4 rounded-xl p-4 flex flex-col items-start gap-y-3">
          <p className="font-bold text-neutral-700 text-lg">No classes yet</p>
          <p className="text-neutral-500">
            Create a class to get a join code you can share with students, then add material to
            generate your first quiz.
          </p>
          <Link href="/teacher/classes">
            <Button variant="primary">Create a class</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8 px-3">
      <div className="flex-1 min-w-0 flex flex-col gap-y-8">
        <h1 className="text-2xl font-bold text-neutral-700">
          Your classes at a glance
        </h1>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={GraduationCap}
            label="Classes"
            value={isPro ? classes.length : `${classes.length}/${FREE_TIER_LIMITS.maxClasses}`}
            tone={!isPro && classes.length >= FREE_TIER_LIMITS.maxClasses ? "rose" : "sky"}
          />
          <StatCard icon={Users} label="Students enrolled" value={totalStudents} tone="green" />
          <StatCard
            icon={AlertCircle}
            label="Needs grading"
            value={pendingGradingCount}
            tone={pendingGradingCount > 0 ? "amber" : "sky"}
          />
          <Link href="/teacher/billing">
            <StatCard icon={CreditCard} label="Plan" value={isPro ? "Pro" : "Free"} tone={isPro ? "indigo" : "neutral"} />
          </Link>
        </div>

        {needsGrading.length > 0 && (
          <section className="flex flex-col gap-y-4">
            <h2 className="text-lg font-bold text-neutral-700">Needs grading</h2>
            <ul className="flex flex-col gap-y-3">
              {needsGrading.map((assignment) => (
                <li key={assignment.id}>
                  <Link href={`/teacher/assignments/${assignment.id}`}>
                    <div className="border-2 border-b-4 rounded-xl p-4 flex items-center justify-between hover:bg-black/5">
                      <div>
                        <p className="font-bold text-neutral-700">{assignment.title}</p>
                        <p className="text-sm text-neutral-500">
                          {assignment.className} · {TYPE_LABEL[assignment.type]}
                        </p>
                      </div>
                      <span className="text-sm font-bold text-amber-600 shrink-0">
                        {assignment.submittedCount - assignment.gradedCount} to grade
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {studentsNeedingAttention.length > 0 && (
          <section className="flex flex-col gap-y-4">
            <h2 className="text-lg font-bold text-neutral-700 flex items-center gap-x-2">
              <TrendingDown className="h-5 w-5 text-rose-500" />
              Students needing attention
            </h2>
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {studentsNeedingAttention.map((student) => (
                <li key={student.userId}>
                  <Link href={`/teacher/students/${student.userId}`}>
                    <div className="border-2 border-b-4 rounded-xl p-4 flex items-center justify-between hover:bg-black/5">
                      <div className="min-w-0">
                        <p className="font-bold text-neutral-700 truncate">{student.userName}</p>
                        <p className="text-xs text-neutral-500 truncate">{student.classNames.join(", ")}</p>
                      </div>
                      <StatusPill tone={student.masteryPct === null ? "neutral" : "rose"} className="shrink-0">
                        {student.masteryPct === null ? "No attempts yet" : `${student.masteryPct}% mastery`}
                      </StatusPill>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {dueThisWeek.length > 0 && (
          <section className="flex flex-col gap-y-4">
            <h2 className="text-lg font-bold text-neutral-700 flex items-center gap-x-2">
              <CalendarClock className="h-5 w-5" />
              Due this week
            </h2>
            <ul className="flex flex-col gap-y-3">
              {dueThisWeek.map((assignment) => (
                <li key={assignment.id}>
                  <Link href={`/teacher/assignments/${assignment.id}`}>
                    <div className="border-2 border-b-4 rounded-xl p-4 flex items-center justify-between hover:bg-black/5">
                      <div>
                        <p className="font-bold text-neutral-700">{assignment.title}</p>
                        <p className="text-sm text-neutral-500">
                          {assignment.className} · {TYPE_LABEL[assignment.type]}
                        </p>
                      </div>
                      <span className="text-sm font-bold text-neutral-500 shrink-0">
                        Due {formatDue(assignment.dueAt)}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="flex flex-col gap-y-4">
          <h2 className="text-lg font-bold text-neutral-700">Your classes</h2>
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {classes.map((classRecord) => (
              <li key={classRecord.id}>
                <Link href={`/teacher/dashboard/${classRecord.id}`}>
                  <div className="border-2 border-b-4 rounded-xl p-4 flex flex-col gap-y-2 hover:bg-black/5">
                    <p className="font-bold text-neutral-700 text-lg">
                      {classRecord.name}
                    </p>
                    <div className="flex items-center gap-x-4 text-sm text-neutral-500">
                      <span className="flex items-center gap-x-1.5">
                        <Users className="h-4 w-4" />
                        {classRecord.enrollments.length} student
                        {classRecord.enrollments.length === 1 ? "" : "s"}
                      </span>
                      <span className="flex items-center gap-x-1.5">
                        <ClipboardList className="h-4 w-4" />
                        {assignmentsByClass.get(classRecord.id) ?? 0} assignment
                        {(assignmentsByClass.get(classRecord.id) ?? 0) === 1 ? "" : "s"}
                      </span>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="lg:w-[320px] shrink-0">
        <div className="lg:sticky lg:top-6 flex flex-col gap-y-4">
          <h2 className="text-lg font-bold text-neutral-700">Recent activity</h2>
          {activity.length === 0 ? (
            <div className="border-2 border-dashed rounded-xl p-4">
              <p className="text-sm text-neutral-500">
                Nothing yet — activity shows up here once students start joining and submitting work.
              </p>
            </div>
          ) : (
            <ul className="flex flex-col gap-y-3">
              {activity.map((event) => (
                <li key={event.id} className="border-2 border-b-4 rounded-xl p-3 flex items-start gap-x-3">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                    event.type === "join" ? "bg-green-100 text-green-500" : "bg-sky-100 text-sky-500"
                  }`}>
                    {event.type === "join" ? <LogIn className="h-4 w-4" /> : <Send className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-neutral-700 leading-snug">{event.label}</p>
                    <p className="text-xs text-neutral-400">
                      {event.className} · {formatRelativeTime(event.timestamp)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherOverviewPage;
