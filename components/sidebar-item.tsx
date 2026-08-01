"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ClipboardList, CreditCard, GraduationCap, Home, LayoutDashboard, Layers, TrendingUp, Trophy, Upload, UserCheck, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Server Components can't pass a component reference (e.g. a lucide icon)
// as a prop to a Client Component — the RSC boundary only serializes plain
// data. Passing a string key instead and resolving it in here, where the
// icon is imported directly, sidesteps that entirely.
const NAMED_ICONS = {
  trophy: Trophy,
  "trending-up": TrendingUp,
  layers: Layers,
  "layout-dashboard": LayoutDashboard,
  users: Users,
  upload: Upload,
  "graduation-cap": GraduationCap,
  "clipboard-list": ClipboardList,
  home: Home,
  "credit-card": CreditCard,
  "user-check": UserCheck,
} as const;

type Props = {
  label: string;
  iconSrc?: string;
  icon?: keyof typeof NAMED_ICONS;
  href: string;
  // Also highlight this item when the current path falls under a different
  // prefix — e.g. "Classes" should stay active on /teacher/dashboard/[id],
  // which isn't a sub-path of /teacher/classes.
  matchPrefix?: string;
  // Small count pill for "needs your attention" items, e.g. unsubmitted
  // assignments. Omitted (not zero) hides it entirely.
  badge?: number;
};

type GroupLabelProps = {
  label: string;
  first?: boolean;
};

export const SidebarGroupLabel = ({ label, first }: GroupLabelProps) => (
  <p className={cn(
    "px-3 pb-1 text-xs font-bold uppercase tracking-wide text-neutral-400",
    first ? "mt-1" : "mt-4",
  )}>
    {label}
  </p>
);

export const SidebarItem = ({
  label,
  iconSrc,
  icon,
  href,
  matchPrefix,
  badge,
}: Props) => {
  const pathname = usePathname();
  const active = pathname === href || (!!matchPrefix && pathname.startsWith(matchPrefix));
  const Icon = icon ? NAMED_ICONS[icon] : undefined;

  return (
    <Button
      variant={active ? "sidebarOutline"  : "sidebar"}
      className="justify-start h-[52px]"
      asChild
    >
      <Link href={href} className="flex items-center w-full">
        {Icon ? (
          <Icon className="mr-5 h-8 w-8" />
        ) : iconSrc ? (
          <Image
            src={iconSrc}
            alt={label}
            className="mr-5"
            height={32}
            width={32}
          />
        ) : null}
        <span className="flex-1 text-left">{label}</span>
        {!!badge && (
          <span className="ml-2 flex items-center justify-center h-5 min-w-[20px] px-1 rounded-full bg-rose-500 text-white text-[11px] font-bold">
            {badge}
          </span>
        )}
      </Link>
    </Button>
  );
};
