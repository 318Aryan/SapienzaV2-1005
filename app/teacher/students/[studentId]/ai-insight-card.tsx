"use client";

import { toast } from "sonner";
import { useState, useTransition } from "react";
import { AlertTriangle, CheckCircle2, Lightbulb, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { generateInsightForStudent } from "@/actions/generate-student-insight";
import type { StudentInsight } from "@/lib/ai";

type Props = {
  studentId: string;
  studentName: string;
};

export const AiInsightCard = ({ studentId, studentName }: Props) => {
  const [pending, startTransition] = useTransition();
  const [insight, setInsight] = useState<StudentInsight | null>(null);

  const onGenerate = () => {
    startTransition(() => {
      generateInsightForStudent(studentId)
        .then((result) => setInsight(result))
        .catch((error) => {
          toast.error(error instanceof Error ? error.message : "Something went wrong.");
        });
    });
  };

  return (
    <div className="border-2 border-b-4 rounded-xl bg-gradient-to-br from-indigo-50 to-sky-50 p-5 flex flex-col gap-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-x-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-500 text-white">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <p className="font-bold text-neutral-700">AI analysis</p>
            <p className="text-xs text-neutral-500">Generated from {studentName}&apos;s real activity — not a template.</p>
          </div>
        </div>
        <Button variant="primary" size="sm" onClick={onGenerate} disabled={pending}>
          {pending ? "Analyzing..." : insight ? "Regenerate" : "Analyze this student"}
        </Button>
      </div>

      {pending && (
        <div className="flex flex-col gap-y-2 animate-pulse">
          <div className="h-3 w-full rounded-full bg-indigo-100" />
          <div className="h-3 w-5/6 rounded-full bg-indigo-100" />
          <div className="h-3 w-2/3 rounded-full bg-indigo-100" />
        </div>
      )}

      {!pending && insight && (
        <div className="flex flex-col gap-y-4">
          <p className="text-sm text-neutral-700 leading-relaxed">{insight.summary}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-lg bg-white/70 border border-green-200 p-3 flex flex-col gap-y-2">
              <p className="text-xs font-bold uppercase tracking-wide text-green-600">Strengths</p>
              <ul className="flex flex-col gap-y-1.5">
                {insight.strengths.map((item, i) => (
                  <li key={i} className="flex items-start gap-x-1.5 text-sm text-neutral-700">
                    <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-green-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-lg bg-white/70 border border-amber-200 p-3 flex flex-col gap-y-2">
              <p className="text-xs font-bold uppercase tracking-wide text-amber-700">Growth areas</p>
              <ul className="flex flex-col gap-y-1.5">
                {insight.growthAreas.map((item, i) => (
                  <li key={i} className="flex items-start gap-x-1.5 text-sm text-neutral-700">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="rounded-lg bg-indigo-500 text-white p-3 flex items-start gap-x-2">
            <Lightbulb className="h-4 w-4 shrink-0 mt-0.5" />
            <p className="text-sm">
              <span className="font-bold">Suggested next step: </span>
              {insight.recommendation}
            </p>
          </div>
        </div>
      )}

      {!pending && !insight && (
        <p className="text-sm text-neutral-500">
          Have AI read {studentName}&apos;s concept mastery and assignment history and summarize
          how they&apos;re doing, in plain language.
        </p>
      )}
    </div>
  );
};
