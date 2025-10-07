"use client";

import { useContext, useEffect, useState } from "react";

import TaskModal from "~/components/task/TaskModal";
import { Button } from "~/components/ui/button";
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
import TaskRow from "~/components/task/TaskRow";
import type { TaskType } from "~/server/types";
import { api } from "~/trpc/react";

export default function Home() {
  const { filteredTasks } = useContext(AppContext);
  const [addTaskOpen, setAddTaskOpen] = useState(false);

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
          <Button
            className="mx-auto mt-2 mb-4"
            variant="outline"
            size="sm"
            onClick={() => setAddTaskOpen(true)}
          >
            Add task...
          </Button>
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
            <div className="flex gap-2">
              <Button type="button" onClick={() => setAddTaskOpen(true)}>
                Create Task
              </Button>
              {/* <Button variant="outline">Import Task</Button> */}
            </div>
          </EmptyContent>
        </Empty>
      )}

      <TaskModal isOpen={addTaskOpen} dismiss={() => setAddTaskOpen(false)} />
    </div>
  );
}
