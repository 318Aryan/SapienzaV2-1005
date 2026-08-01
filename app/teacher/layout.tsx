import { redirect } from "next/navigation";

import { getUserRole } from "@/lib/roles";
import { TeacherSidebar } from "@/components/teacher-sidebar";
import { TeacherMobileHeader } from "@/components/teacher-mobile-header";

type Props = {
  children: React.ReactNode;
};

const TeacherLayout = async ({ children }: Props) => {
  const role = await getUserRole();

  if (!role) {
    redirect("/select-role");
  }

  if (role === "student") {
    redirect("/home");
  }

  return (
    <>
      <TeacherMobileHeader />
      <TeacherSidebar className="hidden lg:flex" />
      <main className="lg:pl-[256px] h-full pt-[50px] lg:pt-0">
        <div className="max-w-[1056px] mx-auto pt-6 h-full">
          {children}
        </div>
      </main>
    </>
  );
};

export default TeacherLayout;
