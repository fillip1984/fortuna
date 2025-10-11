"use client";

import { createContext, useEffect, useState } from "react";

import { api } from "~/trpc/react";

import { isPast, isToday } from "date-fns";
import { isFuture } from "date-fns/isFuture";
import {
  FaCalendarAlt,
  FaCalendarDay,
  FaCalendarPlus,
  FaFlag,
  FaInbox,
} from "react-icons/fa";
import { LuListTodo } from "react-icons/lu";
import { type CollectionType, type SifterType } from "~/server/types";

type AppContextType = {
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
  activeCollection: SifterType | CollectionType | null;
  setActiveCollection: (id: string) => void;
  showCompletedTasks: boolean;
  setShowCompletedTasks: React.Dispatch<React.SetStateAction<boolean>>;
  collections: CollectionType[];
  sifters: SifterType[];
};

export const AppContext = createContext<AppContextType>({
  isLoading: false,
  isError: false,
  refetch: () => {
    // no-op default function with correct signature
    return;
  },
  collections: [],
  activeCollection: null,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setActiveCollection: (id: string) => {
    // no-op default function with correct signature
    return;
  },
  showCompletedTasks: false,
  setShowCompletedTasks: () => {
    // no-op default function with correct signature
    return;
  },
  sifters: [],
});

export function AppContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // default to Today sifter view
  const [activeCollectionId, setActiveCollectionId] = useState<string | null>(
    "Today",
  );
  const [activeCollection, setActiveCollection] = useState<
    SifterType | CollectionType | null
  >(null);

  // filtered tasks state
  const [showCompletedTasks, setShowCompletedTasks] = useState(false);

  // fetched data
  const {
    data: collections,
    isLoading: collectionsLoading,
    isError: collectionsError,
    refetch: collectionsRefetch,
  } = api.collection.findAll.useQuery({
    showCompleted: showCompletedTasks,
  });
  const {
    data: tasks,
    isLoading: tasksLoading,
    isError: tasksError,
    refetch: tasksRefetch,
  } = api.task.findAll.useQuery({
    showCompleted: showCompletedTasks,
  });
  // consolidate loading/error states
  const isLoading = collectionsLoading || tasksLoading;
  const isError = collectionsError || tasksError;
  const refetch = async () => {
    await collectionsRefetch();
    await tasksRefetch();
  };

  // build task sifters
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
  // effects to apply to sifters once tasks are loaded
  useEffect(() => {
    if (!tasks) return;

    setSifters((prev) =>
      [...prev].map((sifter) => {
        if (sifter.name === "Inbox") {
          return {
            ...sifter,
            tasks:
              tasks.filter(
                (t) => !t.dueDate && !t.priority && !t.collectionId,
              ) ?? [],
          };
        } else if (sifter.name === "Today") {
          return {
            ...sifter,
            tasks:
              tasks.filter(
                (t) => t.dueDate && (isPast(t.dueDate) || isToday(t.dueDate)),
              ) ?? [],
          };
        } else if (sifter.name === "Urgent") {
          return {
            ...sifter,
            tasks: tasks?.filter((t) => t.priority === "Urgent") ?? [],
          };
        } else if (sifter.name === "Unscheduled") {
          return {
            ...sifter,
            tasks:
              tasks?.filter((t) => t.priority === "Important" && !t.dueDate) ??
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

  // determine which collection of sifter is active
  useEffect(() => {
    if (!activeCollectionId) {
      // default to Today sifter if no activeCollectionId
      setActiveCollection(sifters.find((s) => s.id === "Today") ?? null);
      return;
    }

    // try to find collection
    const matchingCollection = collections?.find(
      (c) => c.id === activeCollectionId,
    );
    if (matchingCollection) {
      setActiveCollection(matchingCollection);
      return;
    }

    // try to find sifter
    const matchingSifter = sifters.find((s) => s.id === activeCollectionId);
    if (matchingSifter) {
      setActiveCollection(matchingSifter);
      return;
    }

    // if no match, default to Today sifter
    setActiveCollection(sifters.find((s) => s.id === "Today") ?? null);
  }, [activeCollectionId, collections, sifters]);

  return (
    <AppContext.Provider
      value={{
        isLoading,
        isError,
        refetch: () => void refetch(),
        activeCollection,
        setActiveCollection: setActiveCollectionId,
        showCompletedTasks,
        setShowCompletedTasks,
        collections: collections ?? [],
        sifters,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
