"use client";

import { useContext, useEffect, useState } from "react";
import { useDragAndDrop } from "@formkit/drag-and-drop/react";
import {
  eachDayOfInterval,
  endOfYear,
  format,
  isPast,
  isToday,
  startOfDay,
} from "date-fns";
import { AnimatePresence } from "motion/react";
import { FaEllipsisH, FaTrash } from "react-icons/fa";
import { GiBeerStein } from "react-icons/gi";

import type { TaskType } from "~/server/types";
import NewTask from "~/components/task/NewTaskCard";
import TaskRow from "~/components/task/TaskRow";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "~/components/ui/empty";
import { Input } from "~/components/ui/input";
import { Spinner } from "~/components/ui/spinner";
import { AppContext } from "~/context/AppContextProvider";
import { api } from "~/trpc/react";
import { isDeletable } from "~/utils/collection";
import NewTaskViaEmailDnD from "./task/NewTaskViaEmailDnD";

export default function MainView() {
  const {
    isLoading,
    activeCollection,
    setActiveCollection,
    showCompletedTasks,
    setShowCompletedTasks,
  } = useContext(AppContext);

  // collection stuff
  const utils = api.useUtils();
  const { mutateAsync: deleteCollection } = api.collection.delete.useMutation({
    onSuccess: async () => {
      setActiveCollection("Today");
      await Promise.all([
        utils.task.findAll.invalidate(),
        utils.collection.findAll.invalidate(),
      ]);
    },
  });

  // collection name stuff
  const [isRenaming, setIsRenaming] = useState(false);
  const [collectionName, setCollectionName] = useState("Untitled");
  useEffect(() => {
    if (activeCollection) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCollectionName(activeCollection.name);
    }
  }, [activeCollection]);
  const collectionNameInputRef = (node: HTMLInputElement | null) => {
    if (node) {
      node.focus();
    }
  };
  const { mutateAsync: updateCollection } = api.collection.update.useMutation({
    onSuccess: async () => {
      setIsRenaming(false);
      await Promise.all([
        utils.task.findAll.invalidate(),
        utils.collection.findAll.invalidate(),
      ]);
    },
  });

  if (isLoading) {
    return (
      <div className="mt-24 flex h-screen flex-col items-center overflow-hidden">
        <Spinner className="size-18" />
      </div>
    );
  }

  return (
    <>
      <div className="flex h-screen flex-col overflow-y-auto pb-12">
        <div className="flex items-center justify-between border-b p-4">
          <div>
            {!isRenaming && activeCollection ? (
              <h3
                className="cursor-pointer text-2xl font-bold"
                onClick={() => setIsRenaming(true)}
              >
                {collectionName}
              </h3>
            ) : (
              <Input
                ref={collectionNameInputRef}
                value={collectionName}
                onChange={(e) => {
                  setCollectionName(e.target.value);
                }}
                onBlur={() => {
                  if (activeCollection?.name === collectionName) {
                    setIsRenaming(false);
                    return;
                  }
                  void updateCollection({
                    ...activeCollection!,
                    name: collectionName ?? "Untitled",
                  });
                }}
                placeholder="Collection name..."
              />
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost">
                <FaEllipsisH />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-40" align="start">
              <DropdownMenuCheckboxItem
                checked={showCompletedTasks}
                onCheckedChange={setShowCompletedTasks}
                className="text-xs"
              >
                Show Completed
              </DropdownMenuCheckboxItem>
              {activeCollection && isDeletable(activeCollection) && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem
                      onClick={() =>
                        void deleteCollection({ id: activeCollection.id })
                      }
                      className="text-destructive justify-between"
                    >
                      Delete <FaTrash className="text-destructive" />
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {activeCollection?.tasks.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <GiBeerStein />
              </EmptyMedia>
              <EmptyTitle>No Tasks Found...</EmptyTitle>
              <EmptyDescription>
                Either you&apos;ve completed them all or there are no activities
                for the filter/collection you selected.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <div className="w-full">
                <NewTask />
              </div>
            </EmptyContent>
          </Empty>
        ) : activeCollection?.name === "Scheduled" ? (
          <DateSegmentedList tasks={activeCollection.tasks} />
        ) : (
          <SimpleList tasks={activeCollection!.tasks} />
        )}
      </div>
      <NewTaskViaEmailDnD />
    </>
  );
}

const SimpleList = ({ tasks }: { tasks: TaskType[] }) => {
  // DnD stuff
  const { mutate: reorderTasks } = api.task.reorder.useMutation();
  const [draggableTasksParentRef, draggabledTasks, setDraggabledTasks] =
    useDragAndDrop<HTMLDivElement, TaskType>([], {
      onDragend: (data) => {
        reorderTasks(
          data.values.map((section, index) => ({
            id: (section as TaskType).id,
            order: index,
          })),
        );
      },
    });
  useEffect(() => {
    setDraggabledTasks(tasks);
  }, [tasks, setDraggabledTasks]);

  return (
    <>
      <div
        ref={draggableTasksParentRef}
        className="flex flex-col bg-orange-400/40 pr-4"
      >
        <AnimatePresence>
          {draggabledTasks.map((task) => (
            <TaskRow key={task.id} data-label={task.id} task={task} />
          ))}
        </AnimatePresence>
      </div>
      <NewTask />
    </>
  );
};

const DateSegmentedList = ({ tasks }: { tasks: TaskType[] }) => {
  const [today] = useState(new Date());
  const [range] = useState(
    eachDayOfInterval({
      start: today,
      end: endOfYear(today),
    }),
  );

  const overdueSections = {
    label: "Overdue",
    tasks: tasks.filter(
      (task) => task.dueDate && !isToday(task.dueDate) && isPast(task.dueDate),
    ),
  };
  const daysAsSections = range.map((day) => ({
    label: format(day, "MMM dd - EEE"),
    tasks: tasks.filter((task) => {
      if (task.dueDate == null) return false;
      return startOfDay(day).getTime() === startOfDay(task.dueDate).getTime();
    }),
  }));
  const allSections = [overdueSections, ...daysAsSections];

  return (
    <>
      {allSections.map((section) =>
        section.tasks.length > 0 ? (
          <div key={section.label} className="mb-6">
            <h4 className="text-muted-foreground mb-2 px-4 text-sm font-semibold">
              {section.label}
            </h4>
            <hr />
            <div className="flex flex-col">
              <AnimatePresence>
                {section.tasks.map((task) => (
                  <TaskRow key={task.id} data-label={task.id} task={task} />
                ))}
              </AnimatePresence>
            </div>
          </div>
        ) : null,
      )}
      <NewTask />
    </>
  );
};

// const Section = () => {
//   return (
//     <div className="flex flex-col">
//       <AnimatePresence>
//         {tasks.map((task) => (
//           <TaskRow key={task.id} data-label={task.id} task={task} />
//         ))}
//       </AnimatePresence>
//     </div>
//   );
// };
