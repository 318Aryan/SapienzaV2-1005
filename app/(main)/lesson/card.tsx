import Image from "next/image";
import { useCallback } from "react";
import { useAudio, useKey } from "react-use";
import { Check, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { challenges } from "@/db/schema";

type Props = {
  id: number;
  imageSrc: string | null;
  audioSrc: string | null;
  text: string;
  shortcut: string;
  selected?: boolean;
  onClick: () => void;
  disabled?: boolean;
  status?: "correct" | "wrong" | "none",
  type: typeof challenges.$inferSelect["type"];
};

export const Card = ({
  id,
  imageSrc,
  audioSrc,
  text,
  shortcut,
  selected,
  onClick,
  status,
  disabled,
  type,
}: Props) => {
  const [audio, _, controls] = useAudio({ src: audioSrc || "" });

  const handleClick = useCallback(() => {
    if (disabled) return;

    controls.play();
    onClick();
  }, [disabled, onClick, controls]);

  useKey(shortcut, handleClick, {}, [handleClick]);

  const resolved = selected && status !== "none";

  return (
    <div
      onClick={handleClick}
      className={cn(
        "group h-full border-2 rounded-xl border-b-4 hover:bg-black/5 hover:-translate-y-0.5 hover:shadow-sm p-4 lg:p-6 cursor-pointer active:border-b-2 active:translate-y-0 transition-all duration-150",
        selected && "border-sky-300 bg-sky-100 hover:bg-sky-100 shadow-sm",
        selected && status === "correct"
          && "border-green-300 bg-green-100 hover:bg-green-100",
        selected && status === "wrong"
          && "border-rose-300 bg-rose-100 hover:bg-rose-100",
        disabled && "pointer-events-none hover:bg-white hover:translate-y-0 hover:shadow-none",
        type === "ASSIST" && "lg:p-3 w-full"
      )}
    >
      {/*audio*/}
      {imageSrc && (
        <div
          className="relative aspect-square mb-4 max-h-[80px] lg:max-h-[150px] w-full"
        >
          <Image src={imageSrc} fill alt={text} />
        </div>
      )}
      <div className={cn(
        "flex items-center justify-between",
        type === "ASSIST" && "flex-row-reverse",
      )}>
        {type === "ASSIST" && <div />}
        <p className={cn(
          "text-neutral-600 text-sm lg:text-base",
          selected && "text-sky-500",
          selected && status === "correct"
            && "text-green-500 font-medium",
          selected && status === "wrong"
            && "text-rose-500 font-medium",
        )}>
          {text}
        </p>
        <div className={cn(
          "lg:w-[30px] lg:h-[30px] w-[20px] h-[20px] border-2 flex items-center justify-center rounded-lg text-neutral-400 lg:text-[15px] text-xs font-semibold shrink-0 ml-2 transition-colors",
          "group-hover:border-neutral-300 group-hover:text-neutral-500",
          selected && "border-sky-300 text-sky-500",
          selected && status === "correct"
            && "border-green-500 bg-green-500 text-white",
          selected && status === "wrong"
            && "border-rose-500 bg-rose-500 text-white",
        )}>
          {resolved && status === "correct" && <Check className="h-4 w-4 lg:h-[18px] lg:w-[18px] stroke-[3]" />}
          {resolved && status === "wrong" && <X className="h-4 w-4 lg:h-[18px] lg:w-[18px] stroke-[3]" />}
          {!resolved && shortcut}
        </div>
      </div>
    </div>
  );
};
