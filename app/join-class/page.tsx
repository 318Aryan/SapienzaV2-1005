"use client";

import Link from "next/link";
import { toast } from "sonner";
import { useState, useTransition } from "react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { joinClass } from "@/actions/classes";

const JoinClassPage = () => {
  const [code, setCode] = useState("");
  const [pending, startTransition] = useTransition();

  const onJoin = () => {
    if (!code.trim() || pending) {
      return;
    }

    startTransition(() => {
      joinClass(code).catch(() => toast.error("Invalid join code. Try again."));
    });
  };

  return (
    <div className="h-screen flex flex-col items-center justify-center gap-y-6 px-6">
      <div className="flex flex-col items-center gap-y-2 text-center">
        <h1 className="text-2xl lg:text-3xl font-bold text-neutral-700">
          Join your class
        </h1>
        <p className="text-neutral-500">
          Ask your teacher for the class join code.
        </p>
      </div>
      <div className="flex flex-col gap-y-3 w-full max-w-xs">
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="e.g. 7XQK2P"
          className="text-center uppercase tracking-widest font-bold"
          maxLength={6}
          disabled={pending}
        />
        <Button
          variant="primary"
          size="lg"
          onClick={onJoin}
          disabled={pending || !code.trim()}
        >
          Join class
        </Button>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/home">Skip for now</Link>
        </Button>
      </div>
    </div>
  );
};

export default JoinClassPage;
