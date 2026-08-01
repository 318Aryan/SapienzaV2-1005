import { notFound, redirect } from "next/navigation";

import { FeedWrapper } from "@/components/feed-wrapper";
import { UserProgress } from "@/components/user-progress";
import { StickyWrapper } from "@/components/sticky-wrapper";
import { Promo } from "@/components/promo";
import { Quests } from "@/components/quests";
import { cn } from "@/lib/utils";
import { StatusPill } from "@/components/status-pill";
import { TYPE_ICON, TYPE_ICON_STYLE, TYPE_LABEL, URGENCY_TONE, getDueInfo } from "@/lib/assignments-ui";
import {
  getStudentAssignment,
  getUserProgress,
  getUserStreak,
  getUserSubscription,
} from "@/db/queries";

import { SubmitAssignmentForm } from "./submit-assignment-form";

const STEPS = ["Not started", "Submitted", "Graded"] as const;

const StatusTracker = ({ status }: { status: "not_started" | "submitted" | "graded" }) => {
  const currentIndex = status === "not_started" ? 0 : status === "submitted" ? 1 : 2;

  return (
    <div className="flex items-center w-full">
      {STEPS.map((step, index) => (
        <div key={step} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center gap-y-1 shrink-0">
            <div className={cn(
              "h-3 w-3 rounded-full",
              index <= currentIndex ? "bg-green-500" : "bg-neutral-200",
            )} />
            <span className={cn(
              "text-xs whitespace-nowrap",
              index <= currentIndex ? "text-neutral-700 font-bold" : "text-neutral-400",
            )}>
              {step}
            </span>
          </div>
          {index < STEPS.length - 1 && (
            <div className={cn(
              "h-0.5 flex-1 mx-2 mb-4",
              index < currentIndex ? "bg-green-500" : "bg-neutral-200",
            )} />
          )}
        </div>
      ))}
    </div>
  );
};

const formatDateTime = (date: Date | null) => {
  if (!date) return null;
  return new Date(date).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

type Props = {
  params: { assignmentId: string };
};

const AssignmentDetailPage = async ({ params }: Props) => {
  const assignmentId = Number(params.assignmentId);

  if (!assignmentId || Number.isNaN(assignmentId)) {
    notFound();
  }

  const userProgressData = getUserProgress();
  const userSubscriptionData = getUserSubscription();
  const streakData = getUserStreak();
  const assignmentData = getStudentAssignment(assignmentId);

  const [userProgress, userSubscription, streak, assignment] = await Promise.all([
    userProgressData,
    userSubscriptionData,
    streakData,
    assignmentData,
  ]);

  if (!userProgress || !userProgress.activeCourse) {
    redirect("/courses");
  }

  if (!assignment) {
    notFound();
  }

  const isPro = !!userSubscription?.isActive;
  const submission = assignment.submission;
  const status = submission?.status ?? "not_started";
  const Icon = TYPE_ICON[assignment.type];
  const dueInfo = getDueInfo(assignment.dueAt);

  return (
    <div className="flex flex-row-reverse gap-[48px] px-6">
      <StickyWrapper>
        <UserProgress
          activeCourse={userProgress.activeCourse}
          hearts={userProgress.hearts}
          points={userProgress.points}
          streak={streak?.currentStreak ?? 0}
          hasActiveSubscription={isPro}
        />
        {!isPro && <Promo />}
        <Quests points={userProgress.points} />
      </StickyWrapper>
      <FeedWrapper>
        <div className="w-full flex flex-col gap-y-6">
          <div className="border-2 border-b-4 rounded-xl p-4 flex flex-col gap-y-4">
            <div className="flex items-start gap-x-4">
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${TYPE_ICON_STYLE[assignment.type]}`}>
                <Icon className="h-6 w-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-x-2 flex-wrap mb-1">
                  <h1 className="text-2xl font-bold text-neutral-700">{assignment.title}</h1>
                  <StatusPill tone="neutral">{TYPE_LABEL[assignment.type]}</StatusPill>
                </div>
                <p className="text-sm text-neutral-500">
                  {assignment.className} · {assignment.totalPoints} points
                </p>
              </div>
              {status === "not_started" && (
                <StatusPill tone={URGENCY_TONE[dueInfo.urgency]} className="shrink-0">
                  {dueInfo.label}
                </StatusPill>
              )}
            </div>

            <StatusTracker status={status} />

            {assignment.description && (
              <p className="text-sm text-neutral-600 border-t-2 pt-4 whitespace-pre-wrap">
                {assignment.description}
              </p>
            )}
          </div>

          {status === "graded" && submission ? (
            <div className="border-2 border-b-4 rounded-xl p-4 flex flex-col gap-y-3">
              <div className="flex items-center justify-between">
                <p className="font-bold text-neutral-700">Your submission</p>
                <span className="text-lg font-bold text-green-600">
                  {submission.score}/{assignment.totalPoints}
                </span>
              </div>
              <p className="text-sm text-neutral-600 whitespace-pre-wrap border-l-2 pl-3">
                {submission.responseText}
              </p>
              {submission.feedback && (
                <div className="bg-amber-100 text-amber-700 text-sm rounded-md px-3 py-2">
                  <span className="font-bold">Feedback: </span>
                  {submission.feedback}
                </div>
              )}
            </div>
          ) : (
            <>
              {status === "submitted" && submission?.submittedAt && (
                <p className="text-sm text-neutral-500 -mt-2">
                  Submitted {formatDateTime(submission.submittedAt)} · you can resubmit until it&apos;s graded.
                </p>
              )}
              <SubmitAssignmentForm
                assignmentId={assignment.id}
                initialResponse={submission?.responseText ?? ""}
                alreadySubmitted={status === "submitted"}
              />
            </>
          )}
        </div>
      </FeedWrapper>
    </div>
  );
};

export default AssignmentDetailPage;
