"use client";

import { useContext, useEffect, useState } from "react";
import { useDragAndDrop } from "@formkit/drag-and-drop/react";
import { startOfDay } from "date-fns";
import { format } from "date-fns/format";
import { ChevronDownIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { BiCollection } from "react-icons/bi";
import { BsKanban } from "react-icons/bs";
import { FaChevronDown, FaEllipsisH, FaTrash } from "react-icons/fa";
import { GiLevelEndFlag } from "react-icons/gi";
import { IoCloseSharp } from "react-icons/io5";
import { TbTargetArrow } from "react-icons/tb";

import type { ChecklistItemType, TaskType } from "~/server/types";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { AppContext } from "~/context/AppContextProvider";
import {
  PriorityOption,
  TaskStatusOption,
} from "~/generated/prisma/client/enums";
import { api } from "~/trpc/react";
import Combobox from "../my-ui/combobox";
import LoadingAndRetry from "../my-ui/loading-and-retry";
import { Calendar } from "../ui/calendar";
import { Checkbox } from "../ui/checkbox";
import { Dialog, DialogContent } from "../ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { CopyButton } from "../ui/shadcn-io/copy-button";

export default function TaskModal() {
  const {
    isTaskModalOpen,
    showTaskModal,
    hideTaskModal,
    editableTaskItem: taskId,
  } = useContext(AppContext);
  const utils = api.useUtils();
  const {
    data: task,
    isLoading: isTaskLoading,
    isError: isTaskError,
    refetch: refetchTask,
  } = api.task.findById.useQuery(
    { id: taskId ?? "" },
    {
      enabled: !!taskId,
    },
  );
  const { mutateAsync: deleteTask } = api.task.delete.useMutation({
    onSuccess: async () => {
      hideTaskModal();
      await Promise.all([
        utils.task.findAll.invalidate(),
        utils.collection.findAll.invalidate(),
      ]);
    },
  });

  if (!isTaskModalOpen) return null;

  if (isTaskLoading || isTaskError)
    return (
      <Dialog>
        <DialogContent>
          <LoadingAndRetry
            isLoading={isTaskLoading}
            isError={isTaskError}
            retry={refetchTask}
          />
        </DialogContent>
      </Dialog>
    );

  if (!task)
    return (
      <Dialog>
        <DialogContent>No task found.</DialogContent>
      </Dialog>
    );

  return (
    <Dialog
      open={isTaskModalOpen}
      onOpenChange={(open) => {
        if (!open) {
          hideTaskModal();
        } else {
          showTaskModal();
        }
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="m-0 flex h-[90%] flex-col gap-0 overflow-hidden p-0 sm:w-3/4 sm:max-w-200"
      >
        {/* header */}
        <div className="flex items-center justify-end px-1 py-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost">
                <FaEllipsisH />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-36" align="start">
              <DropdownMenuGroup>
                <DropdownMenuItem
                  onClick={() => void deleteTask({ id: task.id })}
                  className="text-destructive justify-between"
                >
                  Delete <FaTrash className="text-destructive" />
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="ghost" onClick={hideTaskModal}>
            <IoCloseSharp />
          </Button>
        </div>

        {/* body */}
        <div className="flex grow overflow-hidden">
          <div className="flex grow flex-col gap-4 overflow-y-auto px-4 pb-12">
            <TaskDetails task={task} />
            <TaskChecklist task={task} />
            <Comments task={task} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const TaskDetails = ({ task }: { task: TaskType }) => {
  const [collapsed, setCollapsed] = useState(false);

  const { collections } = useContext(AppContext);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [priority, setPriority] = useState<PriorityOption | undefined>();
  const [status, setStatus] = useState<TaskStatusOption | null>();
  const [collectionId, setCollectionId] = useState<string | undefined>(
    undefined,
  );

  useEffect(() => {
    if (task) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTitle(task.title);
      setDescription(task.description ?? "");
      setDueDate(task.dueDate ? new Date(task.dueDate) : undefined);
      setPriority(task.priority ?? undefined);
      setStatus(task.status ?? undefined);
      setCollectionId(task.collectionId ?? undefined);
    }
  }, [task]);

  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const utils = api.useUtils();
  const { mutateAsync: updateTask } = api.task.update.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.task.findAll.invalidate(),
        utils.task.findById.invalidate({ id: task.id }),
        utils.collection.findAll.invalidate(),
      ]);
    },
  });

  return (
    <div className="flex flex-col gap-2">
      <Button
        variant={"ghost"}
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-between p-0"
      >
        <div className="flex items-center gap-2">
          <FaChevronDown
            className={`${collapsed ? "-rotate-90" : ""} transition-transform`}
          />
          <h3>Details</h3>
        </div>
      </Button>
      <hr />
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0.5 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0.5 }}
          >
            <div className="flex flex-col gap-2">
              <Input
                placeholder="New task..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => {
                  // have to do this since the cursor defaults into title
                  if (task.title === title) return;
                  void updateTask({
                    ...task,
                    title,
                  });
                }}
              />
              <Textarea
                placeholder="Description..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={async () => {
                  void updateTask({
                    ...task,
                    description,
                  });
                }}
                className="max-h-80"
              />
              {task.source && (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground line-clamp-3 text-xs break-all">
                    Source: {task.source}
                  </span>
                  <CopyButton
                    content={task.source}
                    onCopy={async () => {
                      if (!task.source) return;
                      await navigator.clipboard.writeText(
                        task.source.substring(
                          task.source.indexOf("subject: ") + 9,
                        ),
                      );
                    }}
                  />
                </div>
              )}

              <div className="my-2 grid w-full grid-cols-1 gap-4 sm:mx-auto sm:grid-cols-2">
                <div className="flex items-center gap-3">
                  <TbTargetArrow className="h-5 w-5 shrink-0" />
                  <Popover
                    open={datePickerOpen}
                    onOpenChange={setDatePickerOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        id="date"
                        className="grow justify-between font-normal"
                      >
                        {dueDate ? (
                          <>
                            {dueDate.toLocaleDateString()}
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                setDueDate(undefined);
                                setDatePickerOpen(false);
                                void updateTask({
                                  ...task,
                                  dueDate: null,
                                });
                              }}
                              className="text-muted-foreground"
                            >
                              x
                            </span>
                          </>
                        ) : (
                          <>
                            Due date...
                            <ChevronDownIcon />
                          </>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-auto overflow-hidden p-0"
                      align="start"
                    >
                      <Calendar
                        mode="single"
                        selected={dueDate}
                        endMonth={new Date(2032, 12)}
                        captionLayout="dropdown"
                        onSelect={(date) => {
                          setDueDate(date);
                          setDatePickerOpen(false);
                          void updateTask({
                            ...task,
                            dueDate: date ? startOfDay(date) : null,
                          });
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="flex items-center gap-3">
                  <GiLevelEndFlag className="h-5 w-5 shrink-0" />

                  <Combobox
                    options={Object.entries(PriorityOption).map(
                      ([key, value]) => ({ id: key, label: value }),
                    )}
                    value={priority as string}
                    setValue={(value) => {
                      setPriority(value as PriorityOption | undefined);
                      void updateTask({
                        ...task,
                        priority: value as PriorityOption | null,
                      });
                    }}
                    placeholder="Priority..."
                    className="grow"
                  />
                </div>

                <div className="flex items-center gap-4">
                  <BsKanban className="h-5 w-5 shrink-0" />
                  {/* <div className="min-w-0 grow"> */}
                  <Combobox
                    options={Object.entries(TaskStatusOption).map(
                      ([key, value]) => ({
                        id: key,
                        label: value.replaceAll("_", " "),
                      }),
                    )}
                    value={status as string}
                    setValue={(value) => {
                      setStatus(value as TaskStatusOption);
                      void updateTask({
                        ...task,
                        status: value as TaskStatusOption,
                      });
                    }}
                    placeholder="Status..."
                    className="grow"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <BiCollection className="h-5 w-5 shrink-0" />
                  <Combobox
                    options={collections.map((col) => ({
                      id: col.id,
                      label: col.name,
                    }))}
                    value={collectionId}
                    setValue={(value) => {
                      setCollectionId(value ?? undefined);
                      void updateTask({
                        ...task,
                        collectionId: value ?? null,
                      });
                    }}
                    placeholder="Collection..."
                    className="grow"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const TaskChecklist = ({ task }: { task: TaskType }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [newChecklistItem, setNewChecklistItem] = useState("");

  const utils = api.useUtils();
  const { mutateAsync: addChecklistItem, isPending } =
    api.task.addChecklistItem.useMutation({
      onSuccess: async () => {
        await utils.task.findAll.invalidate();
        await utils.task.findById.invalidate({ id: task.id });
        setNewChecklistItem("");
      },
    });

  const handleAddChecklistItem = async () => {
    if (newChecklistItem) {
      await addChecklistItem({
        taskId: task.id,
        text: newChecklistItem,
        order: task.checklist.length + 1,
      });
    }
  };

  // DnD stuff
  const { mutate: reorderChecklist } = api.task.reorderChecklist.useMutation();
  const [
    draggableChecklistParentRef,
    draggableChecklist,
    setDraggableChecklist,
  ] = useDragAndDrop<HTMLDivElement, ChecklistItemType>([], {
    onDragend: (data) => {
      reorderChecklist(
        data.values.map((item, index) => ({
          id: (item as ChecklistItemType).id,
          order: index,
        })),
      );
    },
  });
  useEffect(() => {
    setDraggableChecklist(task.checklist ?? []);
  }, [task, setDraggableChecklist]);

  return (
    <div className="flex flex-col gap-2">
      <Button
        variant="ghost"
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-between p-0"
      >
        <div className="flex items-center gap-2">
          <FaChevronDown
            className={`${collapsed ? "-rotate-90" : ""} transition-transform`}
          />
          <h3>Checklist</h3>
        </div>
        {task?.checklist.filter((item) => item.completed).length}/
        {task?.checklist.length}
      </Button>
      <hr />
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0.5 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0.5 }}
          >
            <div
              ref={draggableChecklistParentRef}
              className="flex flex-col gap-1"
            >
              {draggableChecklist.map((checklistItem) => (
                <ChecklistItem
                  key={checklistItem.id}
                  data-label={checklistItem.id}
                  checklistItem={checklistItem}
                />
              ))}
            </div>
            <div className="my-2 flex gap-1">
              <Input
                placeholder="New checklist item..."
                value={newChecklistItem}
                onChange={(e) => setNewChecklistItem(e.target.value)}
                onKeyUp={async (e) => {
                  if (e.key === "Enter") await handleAddChecklistItem();
                }}
              />
              <Button
                type="button"
                onClick={handleAddChecklistItem}
                disabled={isPending || !newChecklistItem}
              >
                Add
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ChecklistItem = ({
  checklistItem,
}: {
  checklistItem: ChecklistItemType;
}) => {
  const utils = api.useUtils();
  const { mutateAsync: toggleChecklistItem } =
    api.task.toggleChecklistItem.useMutation({
      onSuccess: async () => {
        await Promise.all([
          utils.task.findAll.invalidate(),
          utils.collection.findAll.invalidate(),
          utils.task.findById.invalidate({ id: checklistItem.taskId }),
        ]);
      },
    });

  const [isEditingItem, setIsEditingItem] = useState(false);
  const editedTextRef = (node: HTMLInputElement | null) => {
    if (node) {
      node.focus();
    }
  };
  const [text, setText] = useState(checklistItem.text);
  const { mutateAsync: updateChecklistItem } =
    api.task.updateChecklistItem.useMutation({
      onSuccess: async () => {
        await Promise.all([
          utils.task.findAll.invalidate(),
          utils.task.findById.invalidate({ id: checklistItem.taskId }),
          utils.collection.findAll.invalidate(),
        ]);
      },
    });

  const { mutateAsync: deleteChecklistItem } =
    api.task.deleteChecklistItem.useMutation({
      onSuccess: async () => {
        await Promise.all([
          utils.task.findAll.invalidate(),
          utils.task.findById.invalidate({ id: checklistItem.taskId }),
          utils.collection.findAll.invalidate(),
        ]);
      },
    });

  return (
    <div className="hover:bg-accent flex items-center gap-2 rounded-lg p-1 select-none">
      <Checkbox
        checked={checklistItem.completed}
        onClick={() =>
          toggleChecklistItem({
            id: checklistItem.id,
            completed: !checklistItem.completed,
          })
        }
      />
      <span
        className={`${checklistItem.completed ? "line-through" : ""} grow`}
        onClick={() => setIsEditingItem((prev) => !prev)}
      >
        {!isEditingItem ? (
          text
        ) : (
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            ref={editedTextRef}
            onBlur={() => {
              void updateChecklistItem({
                id: checklistItem.id,
                text,
              });
              setIsEditingItem(false);
            }}
          />
        )}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => deleteChecklistItem({ id: checklistItem.id })}
      >
        <FaTrash className="text-destructive h-4 w-4" />
      </Button>
    </div>
  );
};

const Comments = ({ task }: { task: TaskType }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [newComment, setNewComment] = useState("");

  const utils = api.useUtils();
  const { mutateAsync: addComment } = api.task.addComment.useMutation({
    onSuccess: async () => {
      await utils.task.findAll.invalidate();
      await utils.task.findById.invalidate({ id: task.id });
      setNewComment("");
    },
  });

  const handleAddComment = async () => {
    if (newComment) {
      await addComment({
        taskId: task.id,
        text: newComment,
      });
    }
  };
  const { mutateAsync: deleteComment } = api.task.deleteComment.useMutation({
    onSuccess: async () => {
      await utils.task.findAll.invalidate();
      await utils.task.findById.invalidate({ id: task.id });
    },
  });

  return (
    <div className="flex flex-col gap-2">
      <Button
        variant={"ghost"}
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-between p-0"
      >
        <div className="flex items-center gap-2">
          <FaChevronDown
            className={`${collapsed ? "-rotate-90" : ""} transition-transform`}
          />
          <h3>Comments</h3>
        </div>
        {task.comments.length}
      </Button>
      <hr />
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0.5 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0.5 }}
          >
            <div className="flex flex-col gap-2">
              {task.comments.map((comment) => (
                <div
                  key={comment.id}
                  className="hover:bg-accent flex flex-col gap-2 rounded-lg p-1"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground text-xs">
                      {format(comment.postedDate, "PPpp")}
                    </span>
                    <Button
                      type="button"
                      onClick={() => deleteComment({ id: comment.id })}
                      variant="ghost"
                      size="icon"
                    >
                      <FaTrash className="text-destructive" />
                    </Button>
                  </div>
                  <span className="grow">{comment.text}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-1">
              <Textarea
                placeholder="New comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyUp={async (e) => {
                  if (e.key === "Enter") {
                    await handleAddComment();
                  }
                }}
              />
              <Button
                type="button"
                onClick={handleAddComment}
                disabled={!newComment}
              >
                Add
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
