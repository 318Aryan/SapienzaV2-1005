import Image from "next/image";

export const Footer = () => {
  return (
    <footer className="w-full border-t-2 border-neutral-200 py-6 px-4">
      <div className="max-w-[988px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-y-3">
        <div className="flex items-center gap-x-2">
          <Image src="/mascot.svg" height={24} width={24} alt="Mascot" />
          <span className="font-bold text-neutral-500 text-sm">LessonAI</span>
        </div>
        <p className="text-xs text-neutral-400">
          &copy; {new Date().getFullYear()} LessonAI. Built on Sapienza.
        </p>
      </div>
    </footer>
  );
};
