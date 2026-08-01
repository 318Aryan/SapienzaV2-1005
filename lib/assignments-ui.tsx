import { Award, ClipboardList, HelpCircle, type LucideIcon } from "lucide-react";

import type { Tone } from "@/components/status-pill";

export type AssignmentType = "homework" | "quiz" | "exam";
export type AssignmentUrgency = "overdue" | "due-today" | "due-soon" | "upcoming" | "none";

export const TYPE_LABEL: Record<AssignmentType, string> = {
  homework: "Homework",
  quiz: "Quiz",
  exam: "Exam",
};

export const TYPE_ICON: Record<AssignmentType, LucideIcon> = {
  homework: ClipboardList,
  quiz: HelpCircle,
  exam: Award,
};

export const TYPE_ICON_STYLE: Record<AssignmentType, string> = {
  homework: "bg-sky-100 text-sky-500",
  quiz: "bg-indigo-100 text-indigo-500",
  exam: "bg-amber-100 text-amber-600",
};

export const URGENCY_TONE: Record<AssignmentUrgency, Tone> = {
  overdue: "rose",
  "due-today": "amber",
  "due-soon": "amber",
  upcoming: "neutral",
  none: "neutral",
};

// Days are compared at midnight so "due today" and "1 day overdue" read the
// way a student expects, not off a raw millisecond diff that flips at
// whatever hour they happen to load the page.
export const getDueInfo = (dueAt: Date | null): { label: string; urgency: AssignmentUrgency } => {
  if (!dueAt) {
    return { label: "No due date", urgency: "none" };
  }

  const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dueDay = startOfDay(new Date(dueAt));
  const today = startOfDay(new Date());
  const diffDays = Math.round((dueDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const daysOverdue = Math.abs(diffDays);
    return { label: `${daysOverdue} day${daysOverdue === 1 ? "" : "s"} overdue`, urgency: "overdue" };
  }
  if (diffDays === 0) {
    return { label: "Due today", urgency: "due-today" };
  }
  if (diffDays === 1) {
    return { label: "Due tomorrow", urgency: "due-soon" };
  }
  if (diffDays <= 3) {
    return { label: `Due in ${diffDays} days`, urgency: "due-soon" };
  }

  return {
    label: `Due ${new Date(dueAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}`,
    urgency: "upcoming",
  };
};
