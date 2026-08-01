import { ClipboardList, GraduationCap, Upload } from "lucide-react";

import { StatCard } from "@/components/stat-card";
import { cn } from "@/lib/utils";
import { FREE_TIER_LIMITS } from "@/constants";
import {
  getAssignmentsForTeacher,
  getClassesByTeacher,
  getTeacherUploadCounts,
  getUserSubscription,
} from "@/db/queries";

import { UpgradeButton } from "./upgrade-button";

const usageColor = (used: number, limit: number) => {
  if (used >= limit) return "bg-rose-500";
  if (used >= limit - 1) return "bg-amber-500";
  return "bg-green-500";
};

const TeacherBillingPage = async () => {
  const classesData = getClassesByTeacher();
  const assignmentsData = getAssignmentsForTeacher();
  const uploadCountsData = getTeacherUploadCounts();
  const subscriptionData = getUserSubscription();

  const [classes, assignments, uploadCounts, subscription] = await Promise.all([
    classesData,
    assignmentsData,
    uploadCountsData,
    subscriptionData,
  ]);

  const isPro = !!subscription?.isActive;
  const classesUsed = classes.length;

  const assignmentsByClass = new Map<number, number>();
  for (const assignment of assignments) {
    assignmentsByClass.set(assignment.classId, (assignmentsByClass.get(assignment.classId) ?? 0) + 1);
  }

  return (
    <div className="flex flex-col gap-y-8 px-3">
      <h1 className="text-2xl font-bold text-neutral-700">Billing</h1>

      <div className={cn(
        "border-2 border-b-4 rounded-xl p-5 flex items-center justify-between gap-4 flex-wrap",
        isPro ? "bg-indigo-50" : "bg-sky-50",
      )}>
        <div>
          <p className={cn("text-xs font-bold uppercase tracking-wide mb-1", isPro ? "text-indigo-600" : "text-sky-600")}>
            Current plan
          </p>
          <p className="text-xl font-bold text-neutral-700">{isPro ? "Teacher Pro" : "Free"}</p>
          <p className="text-sm text-neutral-500">
            {isPro
              ? "Unlimited classes, assignments, and AI-generated content."
              : `Up to ${FREE_TIER_LIMITS.maxClasses} classes, ${FREE_TIER_LIMITS.maxAssignmentsPerClass} assignments per class, ${FREE_TIER_LIMITS.maxUploadsPerClass} uploads per class.`}
          </p>
        </div>
        <UpgradeButton isPro={isPro} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard
          icon={GraduationCap}
          label="Classes"
          value={isPro ? classesUsed : `${classesUsed}/${FREE_TIER_LIMITS.maxClasses}`}
          tone={!isPro && classesUsed >= FREE_TIER_LIMITS.maxClasses ? "rose" : "sky"}
        />
        <StatCard
          icon={ClipboardList}
          label="Assignments"
          value={assignments.length}
          tone="green"
        />
        <StatCard
          icon={Upload}
          label="Uploads"
          value={Array.from(uploadCounts.values()).reduce((sum, n) => sum + n, 0)}
          tone="amber"
        />
      </div>

      {!isPro && classes.length > 0 && (
        <div className="flex flex-col gap-y-4">
          <h2 className="text-lg font-bold text-neutral-700">Usage by class</h2>
          <ul className="flex flex-col gap-y-3">
            {classes.map((classRecord) => {
              const assignmentsUsed = assignmentsByClass.get(classRecord.id) ?? 0;
              const uploadsUsed = uploadCounts.get(classRecord.id) ?? 0;

              return (
                <li key={classRecord.id} className="border-2 border-b-4 rounded-xl p-4 flex flex-col gap-y-3">
                  <p className="font-bold text-neutral-700">{classRecord.name}</p>

                  <div className="flex flex-col gap-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-neutral-500">Assignments</span>
                      <span className="font-bold text-neutral-700">
                        {assignmentsUsed}/{FREE_TIER_LIMITS.maxAssignmentsPerClass}
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-neutral-100 overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all", usageColor(assignmentsUsed, FREE_TIER_LIMITS.maxAssignmentsPerClass))}
                        style={{ width: `${Math.min(100, (assignmentsUsed / FREE_TIER_LIMITS.maxAssignmentsPerClass) * 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-neutral-500">Uploads</span>
                      <span className="font-bold text-neutral-700">
                        {uploadsUsed}/{FREE_TIER_LIMITS.maxUploadsPerClass}
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-neutral-100 overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all", usageColor(uploadsUsed, FREE_TIER_LIMITS.maxUploadsPerClass))}
                        style={{ width: `${Math.min(100, (uploadsUsed / FREE_TIER_LIMITS.maxUploadsPerClass) * 100)}%` }}
                      />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

export default TeacherBillingPage;
