"use client";

import { toast } from "sonner";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import { publishAssignment } from "@/actions/assignments";

type Props = {
  assignmentId: number;
};

export const PublishButton = ({ assignmentId }: Props) => {
  const [pending, startTransition] = useTransition();

  const onPublish = () => {
    startTransition(() => {
      publishAssignment(assignmentId)
        .then(() => toast.success("Assignment published — students can see it now."))
        .catch(() => toast.error("Could not publish. Try again."));
    });
  };

  return (
    <Button
      variant="primaryOutline"
      size="sm"
      onClick={onPublish}
      disabled={pending}
    >
      {pending ? "Publishing..." : "Publish"}
    </Button>
  );
};
