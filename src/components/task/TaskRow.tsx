import { useContext, useState } from "react";
import { isPast } from "date-fns";
import { motion } from "motion/react";
import { BiCollection } from "react-icons/bi";
import { BsKanban } from "react-icons/bs";
import { FaComment, FaList } from "react-icons/fa";
import { GiLevelEndFlag } from "react-icons/gi";
import { TbTargetArrow } from "react-icons/tb";

import type { TaskType } from "~/server/types";
import { AppContext } from "~/context/AppContextProvider";
import { api } from "~/trpc/react";
import { Badge } from "../ui/badge";
import { Checkbox } from "../ui/checkbox";

export default function TaskRow({ task }: { task: TaskType }) {
  const { collections } = useContext(AppContext);
  const [isCompleted, setIsCompleted] = useState(task.completed);
  const { showTaskModalWithItem } = useContext(AppContext);

  const utils = api.useUtils();
  const { mutate: completeTask } = api.task.update.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.task.findAll.invalidate(),
        utils.collection.findAll.invalidate(),
      ]);
    },
  });

  return (
    <motion.div
      initial={{ opacity: 0, height: 0.5 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0.5 }}
      className="select-none"
    >
      <div
        onClick={() => showTaskModalWithItem(task.id)}
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
        <div className="flex flex-col overflow-hidden">
          <span className={`${isCompleted ? "line-through" : ""}`}>
            {task.title}
          </span>
          <span className="text-muted-foreground line-clamp-2 text-xs wrap-anywhere">
            {task.description}
          </span>
          <div className="mt-2 flex flex-wrap gap-2">
            {task.status && (
              <Badge variant="secondary">
                <BsKanban />
                {task.status.replaceAll("_", " ")}
              </Badge>
            )}
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
                  task.priority === "Urgent" ? "destructive" : "secondary"
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
    </motion.div>
  );
}
