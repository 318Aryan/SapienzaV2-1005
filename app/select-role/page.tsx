import { GraduationCap, School } from "lucide-react";

import { setRole } from "@/actions/onboarding";

const SelectRolePage = () => {
  return (
    <div className="h-screen flex flex-col items-center justify-center gap-y-8 px-6">
      <div className="flex flex-col items-center gap-y-2 text-center">
        <h1 className="text-2xl lg:text-3xl font-bold text-neutral-700">
          How will you use SapienzaV2?
        </h1>
        <p className="text-neutral-500">
          This decides what you see next.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
        <form action={setRole.bind(null, "teacher")} className="flex-1">
          <button
            type="submit"
            className="h-full w-full border-2 border-b-4 rounded-xl p-6 flex flex-col items-center gap-y-3 hover:bg-black/5 active:border-b-2 transition"
          >
            <School className="h-10 w-10 text-sky-500" />
            <span className="font-bold text-neutral-700">I&apos;m a Teacher</span>
            <span className="text-sm text-neutral-500 text-center">
              Create a class, upload material, track student mastery
            </span>
          </button>
        </form>
        <form action={setRole.bind(null, "student")} className="flex-1">
          <button
            type="submit"
            className="h-full w-full border-2 border-b-4 rounded-xl p-6 flex flex-col items-center gap-y-3 hover:bg-black/5 active:border-b-2 transition"
          >
            <GraduationCap className="h-10 w-10 text-green-500" />
            <span className="font-bold text-neutral-700">I&apos;m a Student</span>
            <span className="text-sm text-neutral-500 text-center">
              Join a class and start learning
            </span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default SelectRolePage;
