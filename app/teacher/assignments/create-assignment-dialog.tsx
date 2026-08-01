"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { CreateAssignmentForm } from "./create-assignment-form";

type ClassOption = {
  id: number;
  name: string;
};

type Props = {
  classes: ClassOption[];
};

export const CreateAssignmentDialog = ({ classes }: Props) => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="primary">
          <Plus className="mr-2 h-4 w-4" />
          New assignment
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create assignment</DialogTitle>
        </DialogHeader>
        <CreateAssignmentForm classes={classes} onCreated={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
};
