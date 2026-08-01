"use client";

import { toast } from "sonner";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import { createTeacherStripeUrl } from "@/actions/teacher-subscription";

type Props = {
  isPro: boolean;
};

export const UpgradeButton = ({ isPro }: Props) => {
  const [pending, startTransition] = useTransition();

  const onClick = () => {
    startTransition(() => {
      createTeacherStripeUrl()
        .then((response) => {
          if (response.data) {
            window.location.href = response.data;
          }
        })
        .catch(() => toast.error("Something went wrong. Try again."));
    });
  };

  return (
    <Button variant="primary" size="lg" onClick={onClick} disabled={pending} className="shrink-0">
      {pending ? "Loading..." : isPro ? "Manage billing" : "Upgrade to Pro"}
    </Button>
  );
};
