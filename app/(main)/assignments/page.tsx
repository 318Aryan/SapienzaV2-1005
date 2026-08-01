import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, ClipboardList, Layers, ListChecks, Send } from "lucide-react";

import { FeedWrapper } from "@/components/feed-wrapper";
import { UserProgress } from "@/components/user-progress";
import { StickyWrapper } from "@/components/sticky-wrapper";
import { Promo } from "@/components/promo";
import { Quests } from "@/components/quests";
import { StatusPill } from "@/components/status-pill";
import { StatCard } from "@/components/stat-card";
import { TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UrlTabs } from "@/components/url-tabs";
import {
  getAssignmentsForStudent,
  getStudentFlashcards,
  getUserProgress,
  getUserStreak,
  getUserSubscription,
} from "@/db/queries";
import { TYPE_ICON, TYPE_ICON_STYLE, TYPE_LABEL, URGENCY_TONE, getDueInfo } from "@/lib/assignments-ui";

import { FlashcardDeck } from "./flashcard-deck";

type AssignmentListItem = Awaited<ReturnType<typeof getAssignmentsForStudent>>[number];

const AssignmentCard = ({ assignment }: { assignment: AssignmentListItem }) => {
  const Icon = TYPE_ICON[assignment.type];
  const dueInfo = getDueInfo(assignment.dueAt);
  const showUrgency = assignment.status === "not_started";

  return (
    <Link href={`/assignments/${assignment.id}`}>
      <div className="border-2 border-b-4 rounded-xl p-4 flex items-center gap-x-4 hover:bg-black/5">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${TYPE_ICON_STYLE[assignment.type]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-x-2 flex-wrap">
            <span className="font-bold text-neutral-700">{assignment.title}</span>
            <StatusPill tone="neutral">{TYPE_LABEL[assignment.type]}</StatusPill>
          </div>
          <p className="text-sm text-neutral-500">
            {assignment.className} · {assignment.totalPoints} pts
          </p>
        </div>
        <div className="shrink-0 flex flex-col items-end gap-y-1">
          {assignment.status === "graded" ? (
            <span className="text-sm font-bold text-green-600">
              {assignment.score}/{assignment.totalPoints}
            </span>
          ) : assignment.status === "submitted" ? (
            <StatusPill tone="sky">Awaiting grade</StatusPill>
          ) : (
            <StatusPill tone={showUrgency ? URGENCY_TONE[dueInfo.urgency] : "neutral"}>
              {dueInfo.label}
            </StatusPill>
          )}
        </div>
      </div>
    </Link>
  );
};

type Props = {
  searchParams: { tab?: string };
};

const AssignmentsPage = async ({ searchParams }: Props) => {
  const userProgressData = getUserProgress();
  const userSubscriptionData = getUserSubscription();
  const streakData = getUserStreak();
  const assignmentsData = getAssignmentsForStudent();
  const flashcardsData = getStudentFlashcards();

  const [
    userProgress,
    userSubscription,
    streak,
    assignments,
    flashcards,
  ] = await Promise.all([
    userProgressData,
    userSubscriptionData,
    streakData,
    assignmentsData,
    flashcardsData,
  ]);

  if (!userProgress || !userProgress.activeCourse) {
    redirect("/courses");
  }

  const isPro = !!userSubscription?.isActive;

  const toDo = assignments
    .filter((a) => a.status === "not_started")
    .sort((a, b) => (a.dueAt?.getTime() ?? Infinity) - (b.dueAt?.getTime() ?? Infinity));
  const awaitingGrade = assignments.filter((a) => a.status === "submitted");
  const graded = assignments.filter((a) => a.status === "graded");
  const overdueCount = toDo.filter((a) => getDueInfo(a.dueAt).urgency === "overdue").length;
  const defaultTab = searchParams.tab === "flashcards" ? "flashcards" : "assignments";

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
          <h1 className="text-2xl font-bold text-neutral-700">Assignments</h1>

          <UrlTabs defaultValue={defaultTab} validValues={["assignments", "flashcards"]}>
            <TabsList>
              <TabsTrigger value="assignments">
                <ClipboardList className="mr-2 h-4 w-4" />
                Assignments
              </TabsTrigger>
              <TabsTrigger value="flashcards">
                <Layers className="mr-2 h-4 w-4" />
                Flashcards
              </TabsTrigger>
            </TabsList>

            <TabsContent value="assignments" className="flex flex-col gap-y-6">
              {assignments.length === 0 ? (
                <p className="text-neutral-500 text-center">
                  No assignments yet — they&apos;ll show up here once your teacher publishes one.
                </p>
              ) : (
                <>
                  <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <StatCard
                      icon={ListChecks}
                      label={`To do${overdueCount > 0 ? ` (${overdueCount} overdue)` : ""}`}
                      value={toDo.length}
                      tone={overdueCount > 0 ? "rose" : "sky"}
                    />
                    <StatCard icon={Send} label="Awaiting grade" value={awaitingGrade.length} tone="sky" />
                    <StatCard icon={CheckCircle2} label="Graded" value={graded.length} tone="green" />
                  </div>

                  {toDo.length > 0 && (
                    <div className="flex flex-col gap-y-3">
                      <h2 className="text-lg font-bold text-neutral-700">To do</h2>
                      {toDo.map((assignment) => (
                        <AssignmentCard key={assignment.id} assignment={assignment} />
                      ))}
                    </div>
                  )}

                  {awaitingGrade.length > 0 && (
                    <div className="flex flex-col gap-y-3">
                      <h2 className="text-lg font-bold text-neutral-700">Awaiting grade</h2>
                      {awaitingGrade.map((assignment) => (
                        <AssignmentCard key={assignment.id} assignment={assignment} />
                      ))}
                    </div>
                  )}

                  {graded.length > 0 && (
                    <div className="flex flex-col gap-y-3">
                      <h2 className="text-lg font-bold text-neutral-700">Graded</h2>
                      {graded.map((assignment) => (
                        <AssignmentCard key={assignment.id} assignment={assignment} />
                      ))}
                    </div>
                  )}
                </>
              )}
            </TabsContent>

            <TabsContent value="flashcards" className="flex flex-col items-center">
              {flashcards.length === 0 ? (
                <p className="text-neutral-500 text-center">
                  No flashcards yet — check back once your teacher adds material.
                </p>
              ) : (
                <FlashcardDeck flashcards={flashcards} />
              )}
            </TabsContent>
          </UrlTabs>
        </div>
      </FeedWrapper>
    </div>
  );
};

export default AssignmentsPage;
