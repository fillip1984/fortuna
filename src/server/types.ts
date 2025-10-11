import type { JSX } from "react/jsx-dev-runtime";
import type { RouterOutputs } from "~/trpc/react";

export type CollectionType = RouterOutputs["collection"]["findAll"][number];
export type TaskType = RouterOutputs["task"]["findAll"][number];
export type ChecklistItemType = TaskType["checklist"][number];

export type SifterType = {
  id: string;
  name: string;
  icon: JSX.Element;
  tasks: TaskType[];
};
