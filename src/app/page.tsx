"use client";

import { isPast } from "date-fns";
import { useState } from "react";
import { BiCollection } from "react-icons/bi";
import { GiLevelEndFlag } from "react-icons/gi";
import { TbTargetArrow } from "react-icons/tb";

import TaskModal from "~/components/task/TaskModal";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { useCollections } from "~/hooks/useCollections";
import type { TaskType } from "~/server/types";
import { api } from "~/trpc/react";

export default function Home() {
  const { data: tasks } = api.task.findAll.useQuery();

  const [addTaskOpen, setAddTaskOpen] = useState(false);
  return (
    <div className="flex h-screen flex-col overflow-y-auto pb-12">
      {tasks?.map((task) => (
        <TaskRow key={task.id} task={task} />
      ))}
      <Button
        className="mx-auto mt-2 mb-4"
        variant="outline"
        size="sm"
        onClick={() => setAddTaskOpen(true)}
      >
        Add task...
      </Button>
      <TaskModal isOpen={addTaskOpen} dismiss={() => setAddTaskOpen(false)} />
    </div>
  );
}

const TaskRow = ({ task }: { task: TaskType }) => {
  const { collections } = useCollections();
  const [isCompleted, setIsCompleted] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const utils = api.useUtils();
  const { mutate: completeTask } = api.task.update.useMutation({
    onSuccess: async () => {
      await utils.task.findAll.invalidate();
    },
  });
  return (
    <>
      <div
        onClick={() => setShowDetails(true)}
        className="flex items-center gap-4 border-b p-4"
      >
        <Checkbox
          checked={isCompleted}
          onClick={(e) => {
            e.stopPropagation();
            completeTask({
              ...task,
              completed: !isCompleted,
            });
            // easy way to preemptively update UI
            setIsCompleted((prev) => !prev);
          }}
        />
        <div className="flex flex-col">
          <span className={`${isCompleted ? "line-through" : ""}`}>
            {task.title}
          </span>
          <span className="text-muted-foreground line-clamp-2 text-xs">
            {task.description}
          </span>
          <div className="mt-2 flex gap-2">
            {task.dueDate && (
              <Badge
                variant={isPast(task.dueDate) ? "destructive" : "secondary"}
              >
                <TbTargetArrow />
                {new Date(task.dueDate).toLocaleDateString()}
              </Badge>
            )}
            {task.priority && (
              <Badge
                variant={
                  task.priority === "URGENT" ? "destructive" : "secondary"
                }
              >
                <GiLevelEndFlag />
                {task.priority}
              </Badge>
            )}
            {task.collectionId && (
              <Badge variant="secondary">
                <BiCollection />
                {collections?.find((c) => c.id === task.collectionId)?.name}
              </Badge>
            )}
          </div>
        </div>
      </div>
      <TaskModal
        isOpen={showDetails}
        dismiss={() => setShowDetails(false)}
        task={task}
      />
    </>
  );
};
