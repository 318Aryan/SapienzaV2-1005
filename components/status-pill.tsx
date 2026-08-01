import { cn } from "@/lib/utils";

export type Tone = "sky" | "green" | "amber" | "rose" | "indigo" | "neutral";

export const TONE_STYLE: Record<Tone, string> = {
  sky: "bg-sky-100 text-sky-600",
  green: "bg-green-100 text-green-600",
  amber: "bg-amber-100 text-amber-700",
  rose: "bg-rose-100 text-rose-600",
  indigo: "bg-indigo-100 text-indigo-500",
  neutral: "bg-neutral-100 text-neutral-500",
};

type Props = {
  tone: Tone;
  children: React.ReactNode;
  className?: string;
};

export const StatusPill = ({ tone, children, className }: Props) => (
  <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap", TONE_STYLE[tone], className)}>
    {children}
  </span>
);
