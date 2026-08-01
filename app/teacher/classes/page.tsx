import Link from "next/link";
import { Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/status-pill";
import { FREE_TIER_LIMITS } from "@/constants";
import { getClassesByTeacher, getUserSubscription } from "@/db/queries";

import { CreateClassForm } from "./create-class-form";

const TeacherClassesPage = async () => {
  const classesData = getClassesByTeacher();
  const subscriptionData = getUserSubscription();

  const [classes, subscription] = await Promise.all([classesData, subscriptionData]);

  const isPro = !!subscription?.isActive;
  const atLimit = !isPro && classes.length >= FREE_TIER_LIMITS.maxClasses;

  return (
    <div className="flex flex-col gap-y-8 px-3">
      <div>
        <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
          <h1 className="text-2xl font-bold text-neutral-700">
            Your classes
          </h1>
          {!isPro && (
            <StatusPill tone={atLimit ? "rose" : "neutral"}>
              {classes.length}/{FREE_TIER_LIMITS.maxClasses} classes used
            </StatusPill>
          )}
        </div>

        {atLimit ? (
          <div className="border-2 border-b-4 rounded-xl p-4 bg-amber-50 flex items-center justify-between gap-4 flex-wrap">
            <p className="text-sm text-neutral-700">
              You&apos;ve reached the free plan&apos;s {FREE_TIER_LIMITS.maxClasses}-class limit.
            </p>
            <Link href="/teacher/billing">
              <Button variant="primary" size="sm">Upgrade to Pro</Button>
            </Link>
          </div>
        ) : (
          <CreateClassForm />
        )}
      </div>

      {classes.length === 0 ? (
        <p className="text-sm text-neutral-500">
          You haven&apos;t created a class yet. Create one above, then share its join code with
          your students.
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {classes.map((classRecord) => (
            <li key={classRecord.id}>
              <div className="border-2 border-b-4 rounded-xl p-4 flex h-full flex-col gap-y-3 hover:bg-black/5">
                <Link href={`/teacher/dashboard/${classRecord.id}`} className="flex flex-col gap-y-2">
                  <p className="font-bold text-neutral-700 text-lg">
                    {classRecord.name}
                  </p>
                  <div className="flex items-center gap-x-2 text-sm text-neutral-500">
                    <Users className="h-4 w-4" />
                    {classRecord.enrollments.length} student
                    {classRecord.enrollments.length === 1 ? "" : "s"}
                  </div>
                </Link>
                <div className="mt-auto flex items-center justify-between rounded-lg bg-neutral-100 px-3 py-2">
                  <span className="text-xs text-neutral-500">Join code</span>
                  <span className="font-bold tracking-widest text-green-500">
                    {classRecord.joinCode}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default TeacherClassesPage;
