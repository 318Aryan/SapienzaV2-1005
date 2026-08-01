"use client";

import { toast } from "sonner";
import { useState, useTransition } from "react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createClass } from "@/actions/classes";

export const CreateClassForm = () => {
  const [name, setName] = useState("");
  const [pending, startTransition] = useTransition();

  const onCreate = () => {
    if (!name.trim() || pending) {
      return;
    }

    startTransition(() => {
      createClass(name)
        .then(() => setName(""))
        .catch((error) => toast.error(error instanceof Error ? error.message : "Could not create class. Try again."));
    });
  };

  return (
    <div className="flex w-full max-w-md gap-x-2">
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. Grade 10 Biology"
        disabled={pending}
      />
      <Button
        variant="primary"
        onClick={onCreate}
        disabled={pending || !name.trim()}
        className="shrink-0"
      >
        Create class
      </Button>
    </div>
  );
};
