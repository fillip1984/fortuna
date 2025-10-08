import { Checkbox } from "@radix-ui/react-checkbox";
import { isPast } from "date-fns";

import { useContext, useState } from "react";
import { BiCollection } from "react-icons/bi";
import { GiLevelEndFlag } from "react-icons/gi";
import { TbTargetArrow } from "react-icons/tb";
import { AppContext } from "~/context/AppContextProvider";
import type { TaskType } from "~/server/types";
import { api } from "~/trpc/react";
import TaskModal from "./TaskModal";
import { Badge } from "../ui/badge";
import { FaComment, FaList } from "react-icons/fa";

export default function TaskRow({ task }: { task: TaskType }) {
  const { collections } = useContext(AppContext);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const utils = api.useUtils();
  const { mutate: completeTask } = api.task.update.useMutation({
    onSuccess: async () => {
      await utils.task.findAll.invalidate();
      await utils.collection.findAll.invalidate();
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
            {task.checklist.length > 0 && (
              <Badge variant="secondary">
                <FaList />
                <span>
                  {task.checklist.filter((item) => item.completed).length}/
                  {task.checklist.length}
                </span>
              </Badge>
            )}
            {task.comments.length > 0 && (
              <Badge variant="secondary">
                <FaComment />
                {task.comments.length}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {showDetails && (
        <TaskModal
          isOpen={showDetails}
          dismiss={() => setShowDetails(false)}
          task={task}
        />
      )}
    </>
  );
}
