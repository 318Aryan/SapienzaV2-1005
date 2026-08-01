"use client";

import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import { useState, useTransition } from "react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { generateContentFromUpload } from "@/actions/generate-content";

type Summary = {
  courseId: number;
  conceptCount: number;
  questionCount: number;
  flashcardCount: number;
};

type Props = {
  classId: number;
};

export const UploadMaterialForm = ({ classId }: Props) => {
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [pending, startTransition] = useTransition();

  const onGenerate = () => {
    if (!title.trim() || (!text.trim() && !file)) {
      toast.error("Add a title, and paste text or upload a PDF.");
      return;
    }

    const formData = new FormData();
    formData.set("classId", String(classId));
    formData.set("title", title);
    if (text.trim()) formData.set("text", text);
    if (file) formData.set("file", file);

    startTransition(() => {
      generateContentFromUpload(formData)
        .then((result) => {
          setSummary(result);
          setTitle("");
          setText("");
          setFile(null);
          toast.success("Quiz generated!");
        })
        .catch((error) => {
          toast.error(error instanceof Error ? error.message : "Something went wrong. Try again.");
        });
    });
  };

  return (
    <div className="border-2 border-b-4 rounded-xl p-4 flex flex-col gap-y-4">
      <p className="font-bold text-neutral-700">Add material</p>

      <div className="flex flex-col gap-y-1.5">
        <label className="text-sm font-bold text-neutral-700">Title</label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Chapter 4: Cell Biology"
          disabled={pending}
        />
      </div>

      <div className="flex flex-col gap-y-1.5">
        <label className="text-sm font-bold text-neutral-700">Paste notes</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste your notes here, or upload a PDF below"
          rows={6}
          disabled={pending || !!file}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
        />
      </div>

      <div className="flex flex-col gap-y-1.5">
        <label className="text-sm font-bold text-neutral-700">Or upload a PDF instead</label>
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          disabled={pending || !!text.trim()}
          className="text-sm text-neutral-600 file:mr-3 file:rounded-md file:border-0 file:bg-neutral-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-neutral-700 hover:file:bg-neutral-200 disabled:opacity-50"
        />
      </div>

      <Button variant="primary" onClick={onGenerate} disabled={pending} className="self-start">
        {pending ? "Generating..." : "Generate quiz"}
      </Button>

      {summary && (
        <div className="flex items-start gap-x-3 border-2 border-b-4 rounded-xl bg-green-100 p-4">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-500" />
          <div>
            <p className="font-bold text-neutral-700">Done</p>
            <p className="text-sm text-neutral-600">
              {summary.conceptCount} concepts, {summary.questionCount} questions,{" "}
              {summary.flashcardCount} flashcards created.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
