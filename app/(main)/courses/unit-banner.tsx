import Link from "next/link";
import { NotebookText } from "lucide-react";

import { Button } from "@/components/ui/button";

type Props = {
  title: string;
  description: string;
};

export const UnitBanner = ({
  title,
  description,
}: Props) => {
  return (
    <div className="w-full rounded-xl bg-green-500 p-5 text-white flex items-center justify-between">
      <div className="space-y-2.5">
        <h3 className="text-2xl font-bold">
          {title}
        </h3>
        <p className="text-lg">
          {description}
        </p>
      </div>
      <Link href="https://drive.google.com/drive/folders/1hhpmdyM2tddHH4Fge2OxD31XQbPS1YfR?usp=sharing" passHref>
        <Button
          size="lg"
          variant="secondary"
          className="border-2 border-b-4 active:border-b-2 flex items-center"
        >
          <NotebookText className="mr-2" />
          <span className="hidden xl:inline">Resources</span>
        </Button>
      </Link>
    </div>
  );
};
