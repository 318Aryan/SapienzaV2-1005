"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useKey } from "react-use";
import { RotateCw, Shuffle, X as XIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { StatusPill } from "@/components/status-pill";

type Flashcard = {
  id: number;
  front: string;
  back: string;
  conceptTitle: string;
};

type Props = {
  flashcards: Flashcard[];
};

const shuffled = (cards: Flashcard[]) => {
  const copy = [...cards];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

export const FlashcardDeck = ({ flashcards }: Props) => {
  const [queue, setQueue] = useState(() => shuffled(flashcards));
  const [masteredCount, setMasteredCount] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const total = flashcards.length;
  const card = queue[0];

  const onFlip = () => setFlipped((current) => !current);

  const onStillLearning = () => {
    if (!card) return;
    setFlipped(false);
    setQueue((current) => [...current.slice(1), current[0]]);
  };

  const onGotIt = () => {
    if (!card) return;
    setFlipped(false);
    setMasteredCount((current) => current + 1);
    setQueue((current) => current.slice(1));
  };

  const onRestart = () => {
    setQueue(shuffled(flashcards));
    setMasteredCount(0);
    setFlipped(false);
  };

  const progressPct = useMemo(
    () => (total === 0 ? 0 : Math.round((masteredCount / total) * 100)),
    [masteredCount, total],
  );

  useKey(" ", (e) => { e.preventDefault(); if (card) onFlip(); }, {}, [card, flipped]);
  useKey("ArrowRight", () => { if (card && flipped) onGotIt(); }, {}, [card, flipped]);
  useKey("ArrowLeft", () => { if (card && flipped) onStillLearning(); }, {}, [card, flipped]);

  if (!card) {
    return (
      <div className="flex w-full max-w-lg flex-col items-center gap-y-4 mx-auto text-center py-6">
        <Image src="/finish.svg" alt="Deck complete" height={90} width={90} />
        <h2 className="text-2xl font-bold text-neutral-700">Deck complete!</h2>
        <p className="text-neutral-500">
          You reviewed all {total} card{total === 1 ? "" : "s"} in this deck.
        </p>
        <Button variant="primary" size="lg" onClick={onRestart}>
          <Shuffle className="mr-2 h-4 w-4" />
          Study again
        </Button>
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-lg flex-col items-center gap-y-5 mx-auto">
      <div className="w-full flex items-center gap-x-3">
        <Progress value={progressPct} className="h-3" />
        <span className="shrink-0 text-sm font-bold text-neutral-500">
          {masteredCount}/{total}
        </span>
      </div>

      <StatusPill tone="indigo">{card.conceptTitle}</StatusPill>

      <button
        onClick={onFlip}
        className="relative h-72 w-full [perspective:1200px]"
        aria-label={flipped ? "Show question" : "Reveal answer"}
      >
        <div
          className={cn(
            "relative h-full w-full rounded-2xl shadow-md transition-transform duration-500 [transform-style:preserve-3d]",
            flipped && "[transform:rotateY(180deg)]",
          )}
        >
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-y-4 rounded-2xl border-2 border-b-4 border-sky-300 bg-gradient-to-b from-white to-sky-50 p-6 [backface-visibility:hidden]">
            <span className="text-xs font-bold uppercase tracking-wide text-sky-500">Question</span>
            <p className="text-center text-xl font-bold text-neutral-700">{card.front}</p>
            <div className="absolute bottom-4 flex items-center gap-x-1.5 text-xs text-neutral-400">
              <RotateCw className="h-3.5 w-3.5" />
              Tap to reveal
            </div>
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-y-4 rounded-2xl border-2 border-b-4 border-indigo-300 bg-gradient-to-b from-white to-indigo-50 p-6 [backface-visibility:hidden] [transform:rotateY(180deg)]">
            <span className="text-xs font-bold uppercase tracking-wide text-indigo-500">Answer</span>
            <p className="text-center text-lg text-neutral-700">{card.back}</p>
          </div>
        </div>
      </button>

      {!flipped ? (
        <Button variant="primaryOutline" size="lg" onClick={onFlip} className="w-full border-2 border-sky-200">
          <RotateCw className="mr-2 h-4 w-4" />
          Reveal answer
        </Button>
      ) : (
        <div className="flex w-full gap-x-3">
          <Button
            variant="default"
            size="lg"
            onClick={onStillLearning}
            className="flex-1 border-amber-300 text-amber-600 hover:bg-amber-50"
          >
            <XIcon className="mr-2 h-4 w-4" />
            Still learning
          </Button>
          <Button variant="secondary" size="lg" onClick={onGotIt} className="flex-1">
            Got it
          </Button>
        </div>
      )}

      <p className="text-xs text-neutral-400">
        Space to flip · ← still learning · → got it
      </p>
    </div>
  );
};
