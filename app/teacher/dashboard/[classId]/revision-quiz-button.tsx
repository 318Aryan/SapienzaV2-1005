"use client";

import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { WEAK_MASTERY_THRESHOLD } from "@/constants";
import { generateRevisionQuiz } from "@/actions/generate-revision";

type Props = {
  classId: number;
  weakConceptTitles: string[];
};

export const RevisionQuizButton = ({ classId, weakConceptTitles }: Props) => {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ questionCount: number } | null>(null);

  if (weakConceptTitles.length === 0) {
    return null;
  }

  const onGenerate = () => {
    startTransition(() => {
      generateRevisionQuiz(classId)
        .then((response) => {
          setResult({ questionCount: response.questionCount });
          toast.success("Revision quiz generated!");
        })
        .catch((error) => {
          toast.error(error instanceof Error ? error.message : "Something went wrong.");
        });
    });
  };

  return (
    <div className="flex flex-col gap-y-3 border-2 border-b-4 rounded-xl bg-amber-50 p-5">
      <div className="flex items-start gap-x-3">
        <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
        <p className="text-sm text-neutral-700">
          <span className="font-bold">
            {weakConceptTitles.length} concept{weakConceptTitles.length === 1 ? "" : "s"}
          </span>{" "}
          below {WEAK_MASTERY_THRESHOLD}% mastery: {weakConceptTitles.join(", ")}
        </p>
      </div>
      <Button variant="primary" onClick={onGenerate} disabled={pending} className="self-start">
        {pending ? "Generating..." : "Generate revision quiz"}
      </Button>
      {result && (
        <p className="text-sm text-neutral-600">
          Added {result.questionCount} new questions targeting these concepts — visible to
          students now.
        </p>
      )}
    </div>
  );
};
