import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, BookOpen, CheckCircle2, Flame, Heart, PartyPopper, Star, TrendingUp, Zap } from "lucide-react";

import { FeedWrapper } from "@/components/feed-wrapper";
import { UserProgress } from "@/components/user-progress";
import { StickyWrapper } from "@/components/sticky-wrapper";
import { Promo } from "@/components/promo";
import { Quests } from "@/components/quests";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/stat-card";
import { StatusPill } from "@/components/status-pill";
import { WEAK_MASTERY_THRESHOLD } from "@/constants";
import { cn } from "@/lib/utils";
import { getLevelFromXp } from "@/lib/gamification";
import { URGENCY_TONE, getDueInfo } from "@/lib/assignments-ui";
import {
  getAssignmentsForStudent,
  getCourseProgress,
  getStudentConceptMastery,
  getUserProgress,
  getUserStreak,
  getUserSubscription,
} from "@/db/queries";

const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

// Approximates the last 7 calendar days from the two numbers actually
// tracked (currentStreak + lastActiveDate) rather than a real day-by-day
// log, which doesn't exist. Good enough for "here's your current run" —
// it can't show gaps further back than the active streak.
const getWeekActivity = (currentStreak: number, lastActiveDate: string | null | undefined) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const last = lastActiveDate ? new Date(`${lastActiveDate}T00:00:00`) : null;

  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today);
    date.setDate(date.getDate() - (6 - i));

    const active = !!last && currentStreak > 0 && (() => {
      const diffFromLast = Math.round((last.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      return diffFromLast >= 0 && diffFromLast < currentStreak;
    })();

    return { date, active, isToday: date.getTime() === today.getTime() };
  });
};

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
};

const HomePage = async () => {
  const userProgressData = getUserProgress();
  const userSubscriptionData = getUserSubscription();
  const streakData = getUserStreak();
  const courseProgressData = getCourseProgress();
  const assignmentsData = getAssignmentsForStudent();
  const masteryData = getStudentConceptMastery();

  const [
    userProgress,
    userSubscription,
    streak,
    courseProgress,
    assignments,
    mastery,
  ] = await Promise.all([
    userProgressData,
    userSubscriptionData,
    streakData,
    courseProgressData,
    assignmentsData,
    masteryData,
  ]);

  if (!userProgress || !userProgress.activeCourse) {
    redirect("/courses");
  }

  const isPro = !!userSubscription?.isActive;
  const currentStreak = streak?.currentStreak ?? 0;
  const level = getLevelFromXp(userProgress.points);
  const activeLesson = courseProgress?.activeLesson;
  const firstName = userProgress.userName?.split(" ")[0] || "there";
  const weekActivity = getWeekActivity(currentStreak, streak?.lastActiveDate);

  const dueSoon = assignments
    .filter((a) => a.status === "not_started")
    .sort((a, b) => (a.dueAt?.getTime() ?? Infinity) - (b.dueAt?.getTime() ?? Infinity))
    .slice(0, 4);

  const weakConcepts = mastery
    .filter((c) => c.masteryPct !== null && c.masteryPct < WEAK_MASTERY_THRESHOLD)
    .sort((a, b) => (a.masteryPct ?? 0) - (b.masteryPct ?? 0))
    .slice(0, 4);

  return (
    <div className="flex flex-row-reverse gap-[48px] px-6">
      <StickyWrapper>
        <UserProgress
          activeCourse={userProgress.activeCourse}
          hearts={userProgress.hearts}
          points={userProgress.points}
          streak={currentStreak}
          hasActiveSubscription={isPro}
        />
        {!isPro && <Promo />}
        <Quests points={userProgress.points} />
      </StickyWrapper>
      <FeedWrapper>
        <div className="w-full flex flex-col gap-y-8">
          <div>
            <h1 className="text-2xl font-bold text-neutral-700">
              {getGreeting()}, {firstName}
            </h1>
            <p className="text-sm text-neutral-500">Here&apos;s where you left off.</p>
          </div>

          <div className="relative overflow-hidden border-2 border-b-4 rounded-xl p-6 bg-gradient-to-br from-sky-50 to-white">
            <div className="flex items-center gap-x-5 flex-wrap sm:flex-nowrap">
              <div className="hidden sm:flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-sky-500 text-white">
                {activeLesson ? <BookOpen className="h-8 w-8" /> : <PartyPopper className="h-8 w-8" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold uppercase tracking-wide text-sky-600 mb-1">Continue learning</p>
                {activeLesson ? (
                  <>
                    <p className="text-xl font-bold text-neutral-700 truncate">{activeLesson.title}</p>
                    <p className="text-sm text-neutral-500 truncate">
                      {activeLesson.unit.title} &middot; {userProgress.activeCourse.title}
                    </p>
                  </>
                ) : (
                  <p className="text-xl font-bold text-neutral-700">You&apos;ve completed every lesson!</p>
                )}
              </div>
              <Link href={activeLesson ? `/lesson/${activeLesson.id}` : "/courses?tab=learn"} className="w-full sm:w-auto">
                <Button variant="primary" size="lg" className="w-full sm:w-auto shrink-0">
                  {activeLesson ? "Continue" : "Review"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard icon={Flame} label="Streak" value={currentStreak} tone="amber" />
            <StatCard icon={Zap} label="XP" value={userProgress.points} tone="sky" />
            <StatCard icon={Star} label="Level" value={level} tone="indigo" />
            <StatCard icon={Heart} label="Hearts" value={isPro ? "∞" : userProgress.hearts} tone="rose" />
          </div>

          <div className="border-2 border-b-4 rounded-xl p-4 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-x-2">
              <Flame className="h-5 w-5 text-amber-500" />
              <span className="text-sm font-bold text-neutral-700">This week</span>
            </div>
            <div className="flex items-center gap-x-2">
              {weekActivity.map(({ date, active, isToday }, i) => (
                <div key={i} className="flex flex-col items-center gap-y-1">
                  <span className="text-[10px] font-bold text-neutral-400">{WEEKDAY_LABELS[date.getDay()]}</span>
                  <div className={cn(
                    "h-7 w-7 rounded-full flex items-center justify-center",
                    active ? "bg-amber-500" : "bg-neutral-100",
                    isToday && !active && "ring-2 ring-amber-300",
                  )}>
                    {active && <Flame className="h-4 w-4 text-white" />}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <section className="flex flex-col gap-y-3">
              <h2 className="text-lg font-bold text-neutral-700">Due soon</h2>
              {dueSoon.length === 0 ? (
                <div className="border-2 border-dashed rounded-xl p-4 flex items-center gap-x-3 text-neutral-500">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-green-500" />
                  <p className="text-sm">Nothing due, Check back again later</p>
                </div>
              ) : (
                <ul className="flex flex-col gap-y-2">
                  {dueSoon.map((assignment) => {
                    const dueInfo = getDueInfo(assignment.dueAt);
                    return (
                      <li key={assignment.id}>
                        <Link href={`/assignments/${assignment.id}`}>
                          <div className="border-2 border-b-4 rounded-xl p-3 flex items-center justify-between hover:bg-black/5">
                            <div className="min-w-0">
                              <p className="font-bold text-neutral-700 truncate">{assignment.title}</p>
                              <p className="text-xs text-neutral-500">{assignment.className}</p>
                            </div>
                            <StatusPill tone={URGENCY_TONE[dueInfo.urgency]} className="shrink-0">
                              {dueInfo.label}
                            </StatusPill>
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            <section className="flex flex-col gap-y-3">
              <h2 className="text-lg font-bold text-neutral-700 flex items-center gap-x-2">
                <TrendingUp className="h-5 w-5 text-rose-500" />
                Suggested revision
              </h2>
              {weakConcepts.length === 0 ? (
                <div className="border-2 border-dashed rounded-xl p-4 flex items-center gap-x-3 text-neutral-500">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-green-500" />
                  <p className="text-sm">No enough data yet. Check back later</p>
                </div>
              ) : (
                <ul className="flex flex-col gap-y-2">
                  {weakConcepts.map((concept) => (
                    <li key={concept.conceptId}>
                      <Link href="/courses?tab=progress">
                        <div className="border-2 border-b-4 rounded-xl p-3 flex items-center justify-between hover:bg-black/5">
                          <p className="font-bold text-neutral-700 truncate">{concept.title}</p>
                          <StatusPill tone="rose" className="shrink-0">{concept.masteryPct}% mastery</StatusPill>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>
      </FeedWrapper>
    </div>
  );
};

export default HomePage;
