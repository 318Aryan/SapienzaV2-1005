import Link from "next/link";
import { ArrowLeft, Award, Clock, GraduationCap, Heart, TrendingUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FeedWrapper } from "@/components/feed-wrapper";
import { UserProgress } from "@/components/user-progress";
import { StickyWrapper } from "@/components/sticky-wrapper";
import { Promo } from "@/components/promo";
import { Quests } from "@/components/quests";
import { TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UrlTabs } from "@/components/url-tabs";
import { StatCard } from "@/components/stat-card";
import { cn } from "@/lib/utils";
import { getLevelFromXp } from "@/lib/gamification";
import { lessons, units as unitsSchema } from "@/db/schema";
import {
  getCourseProgress,
  getCourses,
  getEnrolledClassesWithCourseStatus,
  getLessonPercentage,
  getStudentConceptMastery,
  getUnits,
  getUserProgress,
  getUserStreak,
  getUserSubscription,
} from "@/db/queries";

import { List } from "./list";
import { JoinClassForm } from "./join-class-form";
import { Unit } from "./unit";

const masteryColor = (pct: number | null) => {
  if (pct === null) return "bg-neutral-200";
  if (pct < 50) return "bg-rose-500";
  if (pct < 75) return "bg-amber-500";
  return "bg-green-500";
};

const VALID_TABS = ["learn", "classes", "progress"] as const;

type Props = {
  searchParams: { tab?: string };
};

const CoursesPage = async ({ searchParams }: Props) => {
  const coursesData = getCourses();
  const userProgressData = getUserProgress();
  const userSubscriptionData = getUserSubscription();
  const enrolledClassesData = getEnrolledClassesWithCourseStatus();
  const streakData = getUserStreak();
  const masteryData = getStudentConceptMastery();
  const unitsData = getUnits();
  const courseProgressData = getCourseProgress();
  const lessonPercentageData = getLessonPercentage();

  const [
    courses,
    userProgress,
    userSubscription,
    enrolledClasses,
    streak,
    mastery,
    units,
    courseProgress,
    lessonPercentage,
  ] = await Promise.all([
    coursesData,
    userProgressData,
    userSubscriptionData,
    enrolledClassesData,
    streakData,
    masteryData,
    unitsData,
    courseProgressData,
    lessonPercentageData,
  ]);

  const courseLen = courses.length;
  const pendingClasses = enrolledClasses.filter((enrolled) => !enrolled.course);
  const hasAnyClasses = enrolledClasses.length > 0;
  const hasActiveCourse = !!(userProgress && userProgress.activeCourse && courseProgress);
  const isPro = !!userSubscription?.isActive;
  const level = userProgress ? getLevelFromXp(userProgress.points) : 1;
  const currentStreak = streak?.currentStreak ?? 0;

  const requestedTab = searchParams.tab;
  const defaultTab = requestedTab && (VALID_TABS as readonly string[]).includes(requestedTab)
    ? requestedTab
    : hasActiveCourse ? "learn" : "classes";

  const content = (
    <div className="w-full flex flex-col gap-y-6">
      <h1 className="text-2xl font-bold text-neutral-700">Learn</h1>

      <UrlTabs defaultValue={defaultTab} validValues={VALID_TABS as unknown as string[]}>
        <TabsList>
          <TabsTrigger value="learn">Learn</TabsTrigger>
          <TabsTrigger value="classes">
            <GraduationCap className="mr-2 h-4 w-4" />
            Classes
          </TabsTrigger>
          <TabsTrigger value="progress">
            <TrendingUp className="mr-2 h-4 w-4" />
            Progress
          </TabsTrigger>
        </TabsList>

        <TabsContent value="learn" className="flex flex-col gap-y-4">
          {!hasActiveCourse ? (
            <p className="text-neutral-500">Pick a class in the Classes tab to start learning.</p>
          ) : (
            <>
              <div className="flex items-center justify-between -mt-1">
                <p className="text-sm text-neutral-500">
                  {userProgress!.activeCourse!.title}
                </p>
                <Link href="/courses?tab=classes">
                  <Button variant="ghost" size="sm">
                    <ArrowLeft className="mr-1 h-4 w-4" />
                    Switch subject
                  </Button>
                </Link>
              </div>
              {units.map((unit) => (
                <div key={unit.id} className="mb-6">
                  <Unit
                    id={unit.id}
                    order={unit.order}
                    description={unit.description}
                    title={unit.title}
                    lessons={unit.lessons}
                    activeLesson={courseProgress!.activeLesson as typeof lessons.$inferSelect & {
                      unit: typeof unitsSchema.$inferSelect;
                    } | undefined}
                    activeLessonPercentage={lessonPercentage}
                  />
                </div>
              ))}
            </>
          )}
        </TabsContent>

        <TabsContent value="classes" className="flex flex-col gap-y-6">
          <JoinClassForm />

          {!hasAnyClasses && (
            <p className="text-neutral-500">
              You&apos;re not in any classes yet — ask your teacher for a join code and enter it above.
            </p>
          )}

          {pendingClasses.length > 0 && (
            <div className="flex flex-col gap-y-3">
              <h2 className="text-lg font-bold text-neutral-700">Classes</h2>
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {pendingClasses.map((pending) => (
                  <li
                    key={pending.classId}
                    className="border-2 border-dashed rounded-xl p-4 flex items-center gap-x-3 text-neutral-500"
                  >
                    <Clock className="h-5 w-5 shrink-0" />
                    <div>
                      <p className="font-bold text-neutral-700">{pending.className}</p>
                      <p className="text-sm">No material has been uploaded yet</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {courseLen > 0 && (
            <div className="flex flex-col gap-y-3">
              <h2 className="text-lg font-bold text-neutral-700">Choose a course</h2>
              <List
                courses={courses}
                activeCourseId={userProgress?.activeCourseId}
              />
            </div>
          )}
        </TabsContent>

        <TabsContent value="progress" className="flex flex-col gap-y-6">
          {!userProgress ? (
            <p className="text-neutral-500">Pick a class in the Classes tab to start tracking progress.</p>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <StatCard icon={TrendingUp} label="Level" value={level} tone="indigo" />
                <StatCard icon={GraduationCap} label="Total XP" value={userProgress.points} tone="sky" />
                <StatCard icon={Clock} label="Day streak" value={currentStreak} tone="amber" />
                <StatCard icon={Award} label="Longest streak" value={streak?.longestStreak ?? 0} tone="amber" />
                <StatCard icon={Heart} label="Hearts" value={isPro ? "∞" : userProgress.hearts} tone="rose" />
                <StatCard icon={GraduationCap} label="Classes joined" value={enrolledClasses.length} tone="green" />
              </div>

              {mastery.length === 0 ? (
                <p className="text-neutral-500 text-center">
                  No concepts tracked yet — join a class and start a lesson to see your mastery here.
                </p>
              ) : (
                <ul className="w-full flex flex-col gap-y-4">
                  {mastery.map((concept) => (
                    <li
                      key={concept.conceptId}
                      className="border-2 border-b-4 rounded-xl p-4 flex flex-col gap-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-neutral-700">{concept.title}</span>
                        <span className="text-neutral-500 text-sm">
                          {concept.masteryPct === null ? "No attempts yet" : `${concept.masteryPct}%`}
                        </span>
                      </div>
                      <div className="h-3 w-full rounded-full bg-neutral-100 overflow-hidden">
                        <div
                          className={cn("h-full rounded-full transition-all", masteryColor(concept.masteryPct))}
                          style={{ width: `${concept.masteryPct ?? 0}%` }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </TabsContent>
      </UrlTabs>
    </div>
  );

  if (!hasActiveCourse) {
    return (
      <div className="h-full max-w-[912px] px-3 mx-auto">
        {content}
      </div>
    );
  }

  return (
    <div className="flex flex-row-reverse gap-[48px] px-6">
      <StickyWrapper>
        <UserProgress
          activeCourse={userProgress!.activeCourse!}
          hearts={userProgress!.hearts}
          points={userProgress!.points}
          streak={currentStreak}
          hasActiveSubscription={isPro}
        />
        {!isPro && <Promo />}
        <Quests points={userProgress!.points} />
      </StickyWrapper>
      <FeedWrapper>
        {content}
      </FeedWrapper>
    </div>
  );
};

export default CoursesPage;
