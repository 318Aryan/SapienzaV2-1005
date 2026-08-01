"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Tabs } from "@/components/ui/tabs";

type Props = {
  defaultValue: string;
  validValues: string[];
  paramName?: string;
  children: React.ReactNode;
  className?: string;
};

// Plain <Tabs defaultValue> only reads that value on first mount. Switching
// tabs via a same-route Link (e.g. /courses?tab=learn -> /courses?tab=classes)
// changes the URL without remounting the page, so defaultValue never
// re-applies and the tab silently stays put. Driving the active tab off
// useSearchParams() instead makes it reactive to exactly that case.
export const UrlTabs = ({ defaultValue, validValues, paramName = "tab", children, className }: Props) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const requested = searchParams.get(paramName);
  const activeValue = requested && validValues.includes(requested) ? requested : defaultValue;

  const onValueChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(paramName, value);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <Tabs value={activeValue} onValueChange={onValueChange} className={className}>
      {children}
    </Tabs>
  );
};
