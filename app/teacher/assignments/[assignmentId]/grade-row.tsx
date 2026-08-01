"use client";

import { toast } from "sonner";
import { useState, useTransition } from "react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusPill, type Tone } from "@/components/status-pill";
import { gradeSubmission } from "@/actions/assignments";

const STATUS_TONE: Record<"not_started" | "submitted" | "graded", Tone> = {
  not_started: "neutral",
  submitted: "sky",
  graded: "green",
};

const STATUS_LABEL: Record<"not_started" | "submitted" | "graded", string> = {
  not_started: "Not submitted",
  submitted: "Submitted",
  graded: "Graded",
};

type Props = {
  submissionId: number;
  studentName: string;
  status: "not_started" | "submitted" | "graded";
  responseText: string | null;
  score: number | null;
  feedback: string | null;
  totalPoints: number;
};

export const GradeRow = ({
  submissionId,
  studentName,
  status,
  responseText,
  score,
  feedback,
  totalPoints,
}: Props) => {
  const [scoreInput, setScoreInput] = useState(score ?? 0);
  const [feedbackInput, setFeedbackInput] = useState(feedback ?? "");
  const [pending, startTransition] = useTransition();

  const onGrade = () => {
    if (scoreInput < 0 || scoreInput > totalPoints) {
      toast.error(`Score must be between 0 and ${totalPoints}`);
      return;
    }

    startTransition(() => {
      gradeSubmission(submissionId, scoreInput, feedbackInput)
        .then(() => toast.success(`${studentName} graded.`))
        .catch(() => toast.error("Could not save grade. Try again."));
    });
  };

  return (
    <div className="border-2 border-b-4 rounded-xl p-4 flex flex-col gap-y-3">
      <div className="flex items-center justify-between">
        <p className="font-bold text-neutral-700">{studentName}</p>
        <StatusPill tone={STATUS_TONE[status]}>{STATUS_LABEL[status]}</StatusPill>
      </div>

      {responseText ? (
        <p className="text-sm text-neutral-600 whitespace-pre-wrap border-l-2 pl-3">
          {responseText}
        </p>
      ) : (
        <p className="text-sm text-neutral-400 italic">No submission yet.</p>
      )}

      {responseText && (
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
          <div className="flex flex-col gap-y-1.5">
            <label className="text-xs font-bold text-neutral-700">Score / {totalPoints}</label>
            <Input
              type="number"
              min={0}
              max={totalPoints}
              value={scoreInput}
              onChange={(e) => setScoreInput(Number(e.target.value))}
              disabled={pending}
              className="w-24"
            />
          </div>
          <div className="flex flex-col gap-y-1.5 flex-1 min-w-[180px]">
            <label className="text-xs font-bold text-neutral-700">Feedback</label>
            <Input
              value={feedbackInput}
              onChange={(e) => setFeedbackInput(e.target.value)}
              placeholder="Optional note for the student"
              disabled={pending}
            />
          </div>
          <Button variant="primary" size="sm" onClick={onGrade} disabled={pending}>
            {pending ? "Saving..." : status === "graded" ? "Update grade" : "Save grade"}
          </Button>
        </div>
      )}
    </div>
  );
};
