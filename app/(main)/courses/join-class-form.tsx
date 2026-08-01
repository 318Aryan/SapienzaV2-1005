"use client";

import { toast } from "sonner";
import { useState, useTransition } from "react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { joinClass } from "@/actions/classes";

export const JoinClassForm = () => {
  const [code, setCode] = useState("");
  const [pending, startTransition] = useTransition();

  const onJoin = () => {
    if (!code.trim() || pending) {
      return;
    }

    startTransition(() => {
      joinClass(code)
        .then(() => setCode(""))
        .catch(() => toast.error("Invalid join code. Try again."));
    });
  };

  return (
    <div className="border-2 border-b-4 rounded-xl p-4 flex flex-col gap-y-3">
      <p className="font-bold text-neutral-700">Join a class</p>
      <p className="text-sm text-neutral-500">
        Got a code from your teacher? Enter it below.
      </p>
      <div className="flex gap-x-2">
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="e.g. 7XQK2P"
          className="uppercase tracking-widest font-bold"
          maxLength={6}
          disabled={pending}
        />
        <Button
          variant="primary"
          onClick={onJoin}
          disabled={pending || !code.trim()}
          className="shrink-0"
        >
          Join
        </Button>
      </div>
    </div>
  );
};
