import { Menu } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetTrigger
} from "@/components/ui/sheet";
import { TeacherSidebar } from "@/components/teacher-sidebar";

export const TeacherMobileSidebar = () => {
  return (
    <Sheet>
      <SheetTrigger>
        <Menu className="text-white" />
      </SheetTrigger>
      <SheetContent className="p-0 z-[100]" side="left">
        <TeacherSidebar />
      </SheetContent>
    </Sheet>
  );
};
