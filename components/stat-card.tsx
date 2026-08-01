import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

import type { Tone } from "./status-pill";

const ICON_TONE_STYLE: Record<Tone, string> = {
  sky: "bg-sky-100 text-sky-500",
  green: "bg-green-100 text-green-500",
  amber: "bg-amber-100 text-amber-600",
  rose: "bg-rose-100 text-rose-500",
  indigo: "bg-indigo-100 text-indigo-500",
  neutral: "bg-neutral-100 text-neutral-500",
};

type Props = {
  icon: LucideIcon;
  label: string;
  value: string | number;
  tone: Tone;
  valueClassName?: string;
  className?: string;
};

export const StatCard = ({ icon: Icon, label, value, tone, valueClassName, className }: Props) => (
  <div className={cn("border-2 border-b-4 rounded-xl p-4 flex items-center gap-x-4", className)}>
    <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full", ICON_TONE_STYLE[tone])}>
      <Icon className="h-5 w-5" />
    </div>
    <div>
      <p className={cn("text-2xl font-bold text-neutral-700", valueClassName)}>{value}</p>
      <p className="text-sm text-neutral-500">{label}</p>
    </div>
  </div>
);
