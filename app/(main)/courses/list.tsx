"use client";

import { toast } from "sonner";
import { useTransition } from "react";
import { useRouter } from "next/navigation";

import { courses, userProgress } from "@/db/schema";
import { upsertUserProgress } from "@/actions/user-progress";

import { Card } from "./card";

type Props = {
  courses: typeof courses.$inferSelect[];
  activeCourseId?: typeof userProgress.$inferSelect.activeCourseId;
};

export const List = ({ courses, activeCourseId }: Props) => {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const onClick = (id: number) => {
    if (pending) return;

    if (id === activeCourseId) {
      return router.push("/home");
    }

    startTransition(() => {
      upsertUserProgress(id)
        .catch(() => toast.error("Something went wrong."));
    });
  };

  return (
    <div className="pt-6 grid grid-cols-2 gap-4">
  {courses.map((course) => (
    <Card
      key={course.id}
      id={course.id}
      title={course.title} // pass description prop here
      imageSrc={course.imageSrc}
      description="" // pass description
      onClick={onClick}
      disabled={pending}
      active={course.id === activeCourseId}
    />
  ))}
</div>

  );
};
