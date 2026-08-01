import { redirect } from "next/navigation";
import { Award, Flame, Lock, Star, Trophy, Zap, type LucideIcon } from "lucide-react";

import { FeedWrapper } from "@/components/feed-wrapper";
import { UserProgress } from "@/components/user-progress";
import { StickyWrapper } from "@/components/sticky-wrapper";
import { Promo } from "@/components/promo";
import { Quests } from "@/components/quests";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UrlTabs } from "@/components/url-tabs";
import {
  getAchievementsWithStatus,
  getTopTenUsers,
  getUserProgress,
  getUserStreak,
  getUserSubscription,
} from "@/db/queries";
import { getLevelFromXp } from "@/lib/gamification";
import { cn } from "@/lib/utils";

const ACHIEVEMENT_ICONS: Record<string, LucideIcon> = {
  first_lesson: Star,
  streak_3: Flame,
  streak_7: Flame,
  xp_100: Zap,
  xp_500: Award,
};

type Props = {
  searchParams: { tab?: string };
};

const AchievementsPage = async ({ searchParams }: Props) => {
  const userProgressData = getUserProgress();
  const userSubscriptionData = getUserSubscription();
  const streakData = getUserStreak();
  const achievementsData = getAchievementsWithStatus();
  const leaderboardData = getTopTenUsers();

  const [
    userProgress,
    userSubscription,
    streak,
    achievements,
    leaderboard,
  ] = await Promise.all([
    userProgressData,
    userSubscriptionData,
    streakData,
    achievementsData,
    leaderboardData,
  ]);

  if (!userProgress || !userProgress.activeCourse) {
    redirect("/courses");
  }

  const isPro = !!userSubscription?.isActive;
  const level = getLevelFromXp(userProgress.points);
  const currentStreak = streak?.currentStreak ?? 0;
  const defaultTab = searchParams.tab === "leaderboard" ? "leaderboard" : "achievements";

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
        <div className="w-full flex flex-col items-center">
          <Trophy className="h-[90px] w-[90px] text-amber-500" />
          <h1 className="text-center font-bold text-neutral-800 text-2xl my-6">
            Achievements
          </h1>
          <p className="text-muted-foreground text-center text-lg mb-6">
            Level {level} &middot; {userProgress.points} XP &middot; {currentStreak}-day streak
          </p>

          <UrlTabs
            defaultValue={defaultTab}
            validValues={["achievements", "leaderboard"]}
            className="w-full flex flex-col items-center"
          >
            <TabsList>
              <TabsTrigger value="achievements">
                <Trophy className="mr-2 h-4 w-4" />
                Achievements
              </TabsTrigger>
              <TabsTrigger value="leaderboard">
                <Award className="mr-2 h-4 w-4" />
                Leaderboard
              </TabsTrigger>
            </TabsList>

            <TabsContent value="achievements" className="w-full">
              <ul className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
                {achievements.map((achievement) => {
                  const unlocked = !!achievement.unlockedAt;
                  const Icon = ACHIEVEMENT_ICONS[achievement.key] ?? Trophy;

                  return (
                    <li
                      key={achievement.id}
                      className={cn(
                        "border-2 border-b-4 rounded-xl p-4 flex items-center gap-x-4",
                        !unlocked && "opacity-50",
                      )}
                    >
                      <div className={cn(
                        "relative flex items-center justify-center h-12 w-12 rounded-full shrink-0",
                        unlocked ? "bg-amber-100" : "bg-neutral-100",
                      )}>
                        <Icon className={cn("h-6 w-6", unlocked ? "text-amber-500" : "text-neutral-400")} />
                        {!unlocked && (
                          <Lock className="absolute -bottom-1 -right-1 h-4 w-4 text-neutral-500 bg-white rounded-full p-0.5" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-neutral-700">{achievement.title}</p>
                        <p className="text-sm text-neutral-500">{achievement.description}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </TabsContent>

            <TabsContent value="leaderboard" className="w-full flex flex-col items-center">
              <p className="text-muted-foreground text-center mb-4">
                See where you stand among other learners in the community.
              </p>
              <Separator className="mb-4 h-0.5 rounded-full w-full" />
              {leaderboard.map((entry, index) => (
                <div
                  key={entry.userId}
                  className="flex items-center w-full p-2 px-4 rounded-xl hover:bg-black/5"
                >
                  <p className="font-bold text-lime-700 mr-4">{index + 1}</p>
                  <Avatar className="border bg-green-500 h-12 w-12 ml-3 mr-6">
                    <AvatarImage className="object-cover" src={entry.userImageSrc} />
                  </Avatar>
                  <p className="font-bold text-neutral-800 flex-1">{entry.userName}</p>
                  <p className="text-muted-foreground">{entry.points} XP</p>
                </div>
              ))}
            </TabsContent>
          </UrlTabs>
        </div>
      </FeedWrapper>
    </div>
  );
};

export default AchievementsPage;
