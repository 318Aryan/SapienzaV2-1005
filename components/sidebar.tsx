import Link from "next/link";
import Image from "next/image";
import {
  ClerkLoading,
  ClerkLoaded,
  UserButton,
} from "@clerk/nextjs";
import { Loader } from "lucide-react";

import { cn } from "@/lib/utils";
import { getAssignmentsForStudent } from "@/db/queries";

import { SidebarGroupLabel, SidebarItem } from "./sidebar-item";

type Props = {
  className?: string;
};

export const Sidebar = async ({ className }: Props) => {
  const assignments = await getAssignmentsForStudent();
  const pendingCount = assignments.filter((a) => a.status === "not_started").length;

  return (
    <div className={cn(
      "flex h-full lg:w-[256px] lg:fixed left-0 top-0 px-4 border-r-2 flex-col",
      className,
    )}>
      <Link href="/home">
        <div className="pt-8 pl-4 pb-7 flex items-center gap-x-3">
          <Image src="/mascot.svg" height={40} width={40} alt="Mascot" />
          <h1 className="text-2xl font-extrabold text-blue-600 tracking-wide">
            SapienzaV2
          </h1>
        </div>
      </Link>
      <div className="flex flex-col gap-y-1 flex-1">
        <SidebarItem
          label="Home"
          href="/home"
          icon="home"
        />
        <SidebarGroupLabel label="My Learning" first />
        <SidebarItem
          label="Learn"
          href="/courses"
          matchPrefix="/courses"
          iconSrc="/learn.svg"
        />
        <SidebarItem
          label="Assignments"
          href="/assignments"
          matchPrefix="/assignments"
          icon="clipboard-list"
          badge={pendingCount}
        />

        <SidebarGroupLabel label="Recognition" />
        <SidebarItem
          label="Achievements"
          href="/achievements"
          matchPrefix="/achievements"
          icon="trophy"
        />
        <SidebarItem
          label="Quests"
          href="/quests"
          iconSrc="/quests.svg"
        />

        <SidebarGroupLabel label="Rewards" />
        <SidebarItem
          label="Shop"
          href="/shop"
          iconSrc="/shop.svg"
        />
      </div>
      <div className="p-3 border-t-2 mt-2">
        <div className="flex items-center gap-x-3 rounded-xl px-2 h-[52px]">
          <ClerkLoading>
            <Loader className="h-8 w-8 text-muted-foreground animate-spin" />
          </ClerkLoading>
          <ClerkLoaded>
            <UserButton afterSignOutUrl="/" />
          </ClerkLoaded>
          <span className="font-bold text-slate-500">Profile</span>
        </div>
      </div>
    </div>
  );
};
