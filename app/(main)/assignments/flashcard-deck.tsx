"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, RotateCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Flashcard = {
  id: number;
  front: string;
  back: string;
  conceptTitle: string;
};

type Props = {
  flashcards: Flashcard[];
};

export const FlashcardDeck = ({ flashcards }: Props) => {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const card = flashcards[index];

  const onNext = () => {
    setFlipped(false);
    setIndex((current) => (current + 1) % flashcards.length);
  };

  const onPrev = () => {
    setFlipped(false);
    setIndex((current) => (current - 1 + flashcards.length) % flashcards.length);
  };

  return (
    <div className="flex w-full max-w-lg flex-col items-center gap-y-4 mx-auto">
      <p className="text-sm text-neutral-500">
        {index + 1} / {flashcards.length} &middot; {card.conceptTitle}
      </p>

      <button
        onClick={() => setFlipped((current) => !current)}
        className="relative h-64 w-full [perspective:1000px]"
        aria-label="Flip flashcard"
      >
        <div
          className={cn(
            "relative h-full w-full rounded-2xl transition-transform duration-500 [transform-style:preserve-3d]",
            flipped && "[transform:rotateY(180deg)]",
          )}
        >
          <div className="absolute inset-0 flex items-center justify-center rounded-2xl border-2 border-b-4 border-sky-300 bg-white p-6 [backface-visibility:hidden]">
            <p className="text-center text-xl font-bold text-neutral-700">{card.front}</p>
          </div>
          <div className="absolute inset-0 flex items-center justify-center rounded-2xl border-2 border-b-4 border-sky-300 bg-sky-50 p-6 [backface-visibility:hidden] [transform:rotateY(180deg)]">
            <p className="text-center text-lg text-neutral-700">{card.back}</p>
          </div>
        </div>
      </button>

      <div className="flex items-center gap-x-2 text-sm text-neutral-500">
        <RotateCw className="h-4 w-4" />
        Tap the card to flip
      </div>

      <div className="flex w-full items-center justify-between">
        <Button variant="ghost" onClick={onPrev} disabled={flashcards.length <= 1}>
          <ChevronLeft className="mr-1 h-4 w-4" />
          Previous
        </Button>
        <Button variant="ghost" onClick={onNext} disabled={flashcards.length <= 1}>
          Next
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
