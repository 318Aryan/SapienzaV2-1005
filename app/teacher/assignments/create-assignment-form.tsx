"use client";

import { toast } from "sonner";
import { useState, useTransition } from "react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createAssignment } from "@/actions/assignments";

type ClassOption = {
  id: number;
  name: string;
};

type Props = {
  classes: ClassOption[];
  onCreated?: () => void;
};

export const CreateAssignmentForm = ({ classes, onCreated }: Props) => {
  const [classId, setClassId] = useState(classes[0]?.id ?? 0);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"homework" | "quiz" | "exam">("homework");
  const [totalPoints, setTotalPoints] = useState(100);
  const [dueAt, setDueAt] = useState("");
  const [pending, startTransition] = useTransition();

  const onCreate = () => {
    if (!classId || !title.trim() || pending) {
      toast.error("Pick a class and add a title.");
      return;
    }

    startTransition(() => {
      createAssignment({
        classId,
        title,
        description,
        type,
        totalPoints,
        dueAt: dueAt || null,
      })
        .then(() => {
          setTitle("");
          setDescription("");
          setDueAt("");
          toast.success("Assignment created as a draft.");
          onCreated?.();
        })
        .catch((error) => toast.error(error instanceof Error ? error.message : "Could not create assignment. Try again."));
    });
  };

  if (classes.length === 0) {
    return (
      <p className="text-sm text-neutral-500">
        Create a class first before adding assignments.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-y-1.5">
          <label className="text-sm font-bold text-neutral-700">Class</label>
          <select
            value={classId}
            onChange={(e) => setClassId(Number(e.target.value))}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
            disabled={pending}
          >
            {classes.map((classOption) => (
              <option key={classOption.id} value={classOption.id}>
                {classOption.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-y-1.5">
          <label className="text-sm font-bold text-neutral-700">Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as "homework" | "quiz" | "exam")}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
            disabled={pending}
          >
            <option value="homework">Homework</option>
            <option value="quiz">Quiz</option>
            <option value="exam">Exam</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-y-1.5">
        <label className="text-sm font-bold text-neutral-700">Title</label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Chapter 4 worksheet"
          disabled={pending}
        />
      </div>

      <div className="flex flex-col gap-y-1.5">
        <label className="text-sm font-bold text-neutral-700">Instructions</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What should students do?"
          rows={3}
          disabled={pending}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-y-1.5">
          <label className="text-sm font-bold text-neutral-700">Total points</label>
          <Input
            type="number"
            min={1}
            value={totalPoints}
            onChange={(e) => setTotalPoints(Number(e.target.value))}
            disabled={pending}
          />
        </div>
        <div className="flex flex-col gap-y-1.5">
          <label className="text-sm font-bold text-neutral-700">Due date (optional)</label>
          <Input
            type="date"
            value={dueAt}
            onChange={(e) => setDueAt(e.target.value)}
            disabled={pending}
          />
        </div>
      </div>

      <Button
        variant="primary"
        onClick={onCreate}
        disabled={pending || !title.trim()}
        className="self-start"
      >
        {pending ? "Creating..." : "Create assignment"}
      </Button>
    </div>
  );
};
