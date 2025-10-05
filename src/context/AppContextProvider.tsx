"use client";
import { createContext, useEffect, useState } from "react";

import { api } from "~/trpc/react";

import {
  FaCalendarAlt,
  FaCalendarDay,
  FaCalendarPlus,
  FaFlag,
  FaInbox,
} from "react-icons/fa";
import { LuListTodo } from "react-icons/lu";
import {
  type SifterType,
  type CollectionType,
  type TaskType,
} from "~/server/types";
import { isFuture } from "date-fns/isFuture";
import { isToday } from "date-fns";

type AppContextType = {
  collections: CollectionType[];
  activeCollectionId: string | null;
  setActiveCollectionId: React.Dispatch<React.SetStateAction<string | null>>;
  filteredTasks: TaskType[];
  sifters: SifterType[];
};

export const AppContext = createContext<AppContextType>({
  collections: [],
  activeCollectionId: "Today",
  setActiveCollectionId: () => {
    // no-op default function with correct signature
    return;
  },
  filteredTasks: [],
  sifters: [],
  //   setFilteredTasks: () => {},
});

export function AppContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // state
  const [activeCollectionId, setActiveCollectionId] = useState<string | null>(
    "Today",
  );
  const [filteredTasks, setFilteredTasks] = useState<TaskType[]>([]);

  // fetched data
  const { data: collections } = api.collection.findAll.useQuery();
  const { data: tasks } = api.task.findAll.useQuery();

  // task sifters
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

  useEffect(() => {
    if (!tasks) return;
    if (activeCollectionId) {
      // attempt to select collection
      const matchingCollection = collections?.find(
        (c) => c.id === activeCollectionId,
      );
      if (matchingCollection) {
        setFilteredTasks(
          tasks.filter((t) => t.collectionId === matchingCollection.id),
        );
        return;
      }

      // fall back to sifter
      const matchingSifter = sifters.find((s) => s.id === activeCollectionId);
      if (matchingSifter) {
        setFilteredTasks(matchingSifter.tasks);
        return;
      }
    }

    // default to all tasks
    setFilteredTasks(tasks);
  }, [activeCollectionId, collections, sifters, tasks]);

  return (
    <AppContext.Provider
      value={{
        collections: collections ?? [],
        activeCollectionId,
        setActiveCollectionId,
        filteredTasks,
        sifters,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
