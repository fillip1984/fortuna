"use client";

import { useContext, useEffect } from "react";

import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "~/components/ui/empty";
import { AppContext } from "~/context/AppContextProvider";

import { useDragAndDrop } from "@formkit/drag-and-drop/react";
import { GiBeerStein } from "react-icons/gi";
import NewTask from "~/components/task/NewTaskCard";
import TaskRow from "~/components/task/TaskRow";
import type { TaskType } from "~/server/types";
import { api } from "~/trpc/react";

export default function Home() {
  const { filteredTasks } = useContext(AppContext);

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
    setDraggabledTasks(filteredTasks ?? []);
  }, [filteredTasks, setDraggabledTasks]);

  return (
    <div className="flex h-screen flex-col overflow-y-auto pb-12">
      {filteredTasks?.length > 0 ? (
        <>
          <div ref={draggableTasksParentRef} className="select-none">
            {draggabledTasks.map((task) => (
              <TaskRow key={task.id} data-label={task.id} task={task} />
            ))}
          </div>
          <NewTask />
        </>
      ) : (
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
      )}
    </div>
  );
}
