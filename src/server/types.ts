import type { JSX } from "react/jsx-dev-runtime";
import type { RouterOutputs } from "~/trpc/react";

export type TaskType = RouterOutputs["task"]["findAll"][number];
export type SifterType = {
  id: string;
  name: string;
  icon: JSX.Element;
  tasks: TaskType[];
};
