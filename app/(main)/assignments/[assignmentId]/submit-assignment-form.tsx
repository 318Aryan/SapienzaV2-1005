"use client";

import { toast } from "sonner";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { submitAssignment } from "@/actions/assignments";

type Props = {
  assignmentId: number;
  initialResponse: string;
  alreadySubmitted: boolean;
};

export const SubmitAssignmentForm = ({ assignmentId, initialResponse, alreadySubmitted }: Props) => {
  const [response, setResponse] = useState(initialResponse);
  const [pending, startTransition] = useTransition();

  const onSubmit = () => {
    if (!response.trim() || pending) {
      return;
    }

    startTransition(() => {
      submitAssignment(assignmentId, response)
        .then(() => toast.success(alreadySubmitted ? "Resubmitted." : "Submitted!"))
        .catch((error) => toast.error(error instanceof Error ? error.message : "Could not submit."));
    });
  };

  return (
    <div className="border-2 border-b-4 rounded-xl p-4 flex flex-col gap-y-3">
      <label className="text-sm font-bold text-neutral-700">Your response</label>
      <textarea
        value={response}
        onChange={(e) => setResponse(e.target.value)}
        placeholder="Write your answer here..."
        rows={8}
        disabled={pending}
        className="rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
      />
      <Button
        variant="primary"
        onClick={onSubmit}
        disabled={pending || !response.trim()}
        className="self-start"
      >
        {pending ? "Submitting..." : alreadySubmitted ? "Resubmit" : "Submit"}
      </Button>
    </div>
  );
};
