"use client";

import { useContext, useEffect, useState } from "react";

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
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
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
          {/* <Button
            className="mx-auto mt-2 mb-4"
            variant="outline"
            size="sm"
            onClick={() => setAddTaskOpen(true)}
          >
            Add task...
          </Button> */}
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

const NewTask = () => {
  const { activeCollectionId } = useContext(AppContext);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const utils = api.useUtils();
  const { mutate: createTask } = api.task.create.useMutation({
    onSuccess: async () => {
      await utils.task.findAll.invalidate();
      await utils.collection.findAll.invalidate();
      setTitle("");
      setDescription("");
    },
  });

  const handleCreateTask = async () => {
    // default to specific things that make life easier,
    // such as if the Today sifter is active, default due date to today,
    // if a collection is active, default to that collection
    createTask({
      title,
      description,
      dueDate: activeCollectionId === "Today" ? new Date() : null,
      priority:
        activeCollectionId === "Urgent"
          ? "URGENT"
          : activeCollectionId === "Unscheduled"
            ? "IMPORTANT"
            : null,
      collectionId: activeCollectionId ?? null,
    });
  };

  return (
    <div className="mt-4 flex flex-col gap-2 px-4">
      <Input
        placeholder="New task..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <Textarea
        placeholder="Description..."
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <Button
        className="mx-auto mt-2 mb-4"
        variant="outline"
        size="sm"
        onClick={handleCreateTask}
      >
        Add task...
      </Button>
    </div>
  );
};
