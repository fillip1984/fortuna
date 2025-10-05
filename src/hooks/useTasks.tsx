import { isFuture, isToday } from "date-fns";
import { useEffect, useState } from "react";
import {
  FaCalendarAlt,
  FaCalendarDay,
  FaCalendarPlus,
  FaFlag,
  FaInbox,
} from "react-icons/fa";
import { LuListTodo } from "react-icons/lu";
import type { SifterType } from "~/server/types";
import { api } from "~/trpc/react";

export const useTasks = () => {
  const [sifters, setSifters] = useState<SifterType[]>([
    { id: "Inbox", name: "Inbox", icon: <FaInbox />, tasks: [] },
    { id: "Today", name: "Today", icon: <FaCalendarDay />, tasks: [] },
    { id: "Urgent", name: "Urgent", icon: <FaFlag />, tasks: [] },
    {
      id: "Unscheduled",
      name: "Unscheduled",
      icon: <FaCalendarPlus />,
      tasks: [],
    },
    { id: "Scheduled", name: "Scheduled", icon: <FaCalendarAlt />, tasks: [] },
    { id: "All", name: "All", icon: <LuListTodo />, tasks: [] },
  ]);

  const {
    data: tasks,
    isLoading,
    isError,
    refetch,
  } = api.task.findAll.useQuery();
  useEffect(() => {
    if (!tasks) return;

    setSifters((prev) =>
      [...prev].map((sifter) => {
        if (sifter.name === "Inbox") {
          return {
            ...sifter,
            tasks: tasks.filter((t) => !t.collectionId) ?? [],
          };
        } else if (sifter.name === "Today") {
          return {
            ...sifter,
            tasks: tasks.filter((t) => t.dueDate && isToday(t.dueDate)) ?? [],
          };
        } else if (sifter.name === "Urgent") {
          return {
            ...sifter,
            tasks: tasks?.filter((t) => t.priority === "URGENT") ?? [],
          };
        } else if (sifter.name === "Unscheduled") {
          return {
            ...sifter,
            tasks:
              tasks?.filter((t) => t.priority === "IMPORTANT" && !t.dueDate) ??
              [],
          };
        } else if (sifter.name === "Scheduled") {
          return {
            ...sifter,
            tasks: tasks?.filter((t) => t.dueDate && isFuture(t.dueDate)) ?? [],
          };
        } else if (sifter.name === "All") {
          return { ...sifter, tasks: tasks ?? [] };
        } else {
          return sifter;
        }
      }),
    );
  }, [tasks]);

  return { sifters, tasks, isLoading, isError, refetch };
};
