import { redirect } from "next/navigation";

import { getUserRole } from "@/lib/roles";
import { Sidebar } from "@/components/sidebar";
import { MobileHeader } from "@/components/mobile-header";

type Props = {
  children: React.ReactNode;
};

const MainLayout = async ({
  children,
}: Props) => {
  const role = await getUserRole();

  if (!role) {
    redirect("/select-role");
  }

  if (role === "teacher") {
    redirect("/teacher/overview");
  }

  return (
    <>
      <MobileHeader />
      <Sidebar className="hidden lg:flex" />
      <main className="lg:pl-[256px] h-full pt-[50px] lg:pt-0">
        <div className="max-w-[1056px] mx-auto pt-6 h-full">
          {children}
          <script src="https://cdn.botpress.cloud/webchat/v3.2/inject.js" defer></script>
          <script src="https://files.bpcontent.cloud/2025/08/09/11/20250809113331-EL7AI4F4.js" defer></script>
        </div>
      </main>
    </>
  );
};

export default MainLayout;
