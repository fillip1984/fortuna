import type { JSX } from "react/jsx-dev-runtime";
import type { RouterOutputs } from "~/trpc/react";

export type TaskType = RouterOutputs["task"]["findAll"][number];
export type SifterType = {
  icon: JSX.Element;
  name: string;
  tasks: TaskType[];
};
