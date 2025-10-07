"use client";

import type { PriorityOption } from "@prisma/client";
import { Check, ChevronDownIcon } from "lucide-react";
import { useContext, useEffect, useState, type FormEvent } from "react";
import { BiCollection } from "react-icons/bi";
import { FaChevronDown, FaTrash } from "react-icons/fa";
import { GiLevelEndFlag } from "react-icons/gi";
import { TbTargetArrow } from "react-icons/tb";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { AppContext } from "~/context/AppContextProvider";
import type { TaskType } from "~/server/types";
import { api } from "~/trpc/react";
import { Calendar } from "../ui/calendar";
import { Checkbox } from "../ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from "../ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { format } from "date-fns/format";

export default function TaskModal({
  isOpen,
  dismiss,
  task,
}: {
  isOpen: boolean;
  dismiss: () => void;
  task?: TaskType;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const { collections, activeCollectionId } = useContext(AppContext);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [priority, setPriority] = useState<PriorityOption | undefined>();
  const [collectionName, setCollectionName] = useState<string>("");

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description ?? "");
      setDueDate(task.dueDate ? new Date(task.dueDate) : undefined);
      setPriority(task.priority ?? undefined);
      setCollectionName(
        task.collectionId
          ? (collections?.find((c) => c.id === task.collectionId)?.name ?? "")
          : "",
      );
    } else {
      // default to specific things that make life easier,
      // such as if the Today sifter is active, default due date to today,
      // if a collection is active, default to that collection
      setDueDate(activeCollectionId === "Today" ? new Date() : undefined);
      setPriority(
        activeCollectionId === "Urgent"
          ? "URGENT"
          : activeCollectionId === "Unscheduled"
            ? "IMPORTANT"
            : undefined,
      );
      setCollectionName(
        activeCollectionId &&
          collections.find((c) => c.id === activeCollectionId)
          ? (collections.find((c) => c.id === activeCollectionId)?.name ?? "")
          : "",
      );
    }
  }, [collections, task, activeCollectionId]);

  const utils = api.useUtils();
  const { mutateAsync: createTask } = api.task.create.useMutation({
    onSuccess: async () => {
      await utils.task.findAll.invalidate();
      await utils.collection.findAll.invalidate();
      resetForm();
      dismiss();
    },
  });
  const { mutateAsync: updateTask } = api.task.update.useMutation({
    onSuccess: async () => {
      await utils.task.findAll.invalidate();
      await utils.collection.findAll.invalidate();
      resetForm();
      dismiss();
    },
  });

  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [priorityPickerOpen, setPriorityPickerOpen] = useState(false);
  const [collectionPickerOpen, setCollectionPickerOpen] = useState(false);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setDueDate(undefined);
    setPriority(undefined);
    setCollectionName("");
  };

  const handleDismiss = () => {
    resetForm();
    dismiss();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (title) {
      if (task) {
        const effectiveCollection =
          collections?.find((c) => c.name === collectionName) ?? null;
        const effectiveOrder =
          effectiveCollection && task.collectionId !== effectiveCollection.id
            ? effectiveCollection._count.tasks
            : task.order;
        await updateTask({
          id: task.id,
          title,
          description,
          order: effectiveOrder,
          completed: task.completed,
          dueDate: dueDate ?? null,
          priority: priority ?? null,
          collectionId: effectiveCollection?.id ?? null,
        });
      } else {
        await createTask({
          title: title,
          description: description,
          dueDate: dueDate ?? null,
          priority: priority ?? null,
          collectionId:
            collections?.find((c) => c.name === collectionName)?.id ?? null,
        });
      }
    }
  };
  return (
    <Dialog open={isOpen} onOpenChange={handleDismiss}>
      <DialogContent className="">
        <DialogTitle>{task ? "Edit Task" : "New Task"}</DialogTitle>
        <form onSubmit={handleSubmit} className="flex flex-col gap-2 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FaChevronDown
                onClick={() => setCollapsed(!collapsed)}
                className={`${collapsed ? "-rotate-90" : ""} transition-transform`}
              />
              <h3>Details</h3>
            </div>
          </div>
          <hr />
          {!collapsed && (
            <>
              <div className="flex flex-col gap-2">
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
                <div className="flex items-center gap-3">
                  <TbTargetArrow />
                  <Popover
                    open={datePickerOpen}
                    onOpenChange={setDatePickerOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        id="date"
                        className="w-48 justify-between font-normal"
                      >
                        {dueDate ? (
                          <>
                            {dueDate.toLocaleDateString()}
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                setDueDate(undefined);
                                setDatePickerOpen(false);
                              }}
                              className="text-muted-foreground"
                            >
                              x
                            </span>
                          </>
                        ) : (
                          <>
                            Select due date
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
                        captionLayout="dropdown"
                        onSelect={(date) => {
                          setDueDate(date);
                          setDatePickerOpen(false);
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="flex items-center gap-3">
                  <GiLevelEndFlag />
                  <Popover
                    open={priorityPickerOpen}
                    onOpenChange={setPriorityPickerOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        id="priority"
                        className="w-48 justify-between font-normal"
                      >
                        {priority ? (
                          <>
                            {priority}
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                setPriority(undefined);
                                setPriorityPickerOpen(false);
                              }}
                              className="text-muted-foreground"
                            >
                              x
                            </span>
                          </>
                        ) : (
                          <>
                            Select priority
                            <ChevronDownIcon />
                          </>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-48 overflow-hidden p-2"
                      align="center"
                    >
                      <>
                        <div
                          onClick={() => {
                            setPriority("URGENT");
                            setPriorityPickerOpen(false);
                          }}
                          className="hover:bg-accent flex items-center justify-between gap-2 rounded-lg p-1"
                        >
                          Urgent
                          {priority === "URGENT" && (
                            <Check className="text-muted-foreground" />
                          )}
                        </div>
                        <div
                          onClick={() => {
                            setPriority("IMPORTANT");
                            setPriorityPickerOpen(false);
                          }}
                          className="hover:bg-accent flex items-center justify-between gap-2 rounded-lg p-1"
                        >
                          Important
                          {priority === "IMPORTANT" && (
                            <Check className="text-muted-foreground" />
                          )}
                        </div>
                      </>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="flex items-center gap-3">
                  <BiCollection />
                  <Popover
                    open={collectionPickerOpen}
                    onOpenChange={setCollectionPickerOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        id="collection"
                        className="w-48 justify-between font-normal"
                      >
                        {collectionName ? (
                          <>
                            {collectionName}
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                setCollectionName("");
                                setCollectionPickerOpen(false);
                              }}
                              className="text-muted-foreground"
                            >
                              x
                            </span>
                          </>
                        ) : (
                          <>
                            Select collection
                            <ChevronDownIcon />
                          </>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-48 overflow-hidden p-2"
                      align="center"
                    >
                      <>
                        {collections?.map((c) => (
                          <div
                            key={c.id}
                            onClick={() => {
                              setCollectionName(c.name);
                              setCollectionPickerOpen(false);
                            }}
                            className="hover:bg-accent flex items-center justify-between gap-2 rounded-lg p-1"
                          >
                            {c.name}
                            {collectionName === c.name && (
                              <Check className="text-muted-foreground" />
                            )}
                          </div>
                        ))}
                      </>
                    </PopoverContent>
                  </Popover>
                </div>

                {task && <TaskChecklist task={task} />}
                {task && <Comments task={task} />}
              </div>
            </>
          )}
        </form>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button
            onClick={handleSubmit}
            form="add-collection-form"
            type="submit"
          >
            {task ? "Save" : "Add"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const TaskChecklist = ({ task }: { task: TaskType }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [newChecklistItem, setNewChecklistItem] = useState("");

  const utils = api.useUtils();
  const { mutateAsync: addChecklistItem } =
    api.task.addChecklistItem.useMutation({
      onSuccess: async () => {
        await utils.task.findAll.invalidate();
        setNewChecklistItem("");
      },
    });
  const { mutateAsync: toggleChecklistItem } =
    api.task.toggleChecklistItem.useMutation({
      onSuccess: async () => {
        await utils.task.findAll.invalidate();
      },
    });
  const { mutateAsync: deleteChecklistItem } =
    api.task.deleteChecklistItem.useMutation({
      onSuccess: async () => {
        await utils.task.findAll.invalidate();
      },
    });

  const handleAddChecklistItem = async () => {
    if (newChecklistItem) {
      await addChecklistItem({
        taskId: task.id,
        text: newChecklistItem,
      });
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FaChevronDown
            onClick={() => setCollapsed(!collapsed)}
            className={`${collapsed ? "-rotate-90" : ""} transition-transform`}
          />
          <h3>Checklist</h3>
        </div>
        {task?.checklist.filter((item) => item.completed).length}/
        {task?.checklist.length}
      </div>
      <hr />
      {!collapsed && (
        <>
          <div>
            {task.checklist.map((item) => (
              <div
                key={item.id}
                className="hover:bg-accent flex items-center gap-2 rounded-lg p-1"
              >
                <Checkbox
                  checked={item.completed}
                  onClick={() =>
                    toggleChecklistItem({
                      id: item.id,
                      completed: !item.completed,
                    })
                  }
                />
                <span
                  className={`${item.completed ? "line-through" : ""} flex-grow`}
                >
                  {item.text}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteChecklistItem({ id: item.id })}
                >
                  <FaTrash className="text-destructive h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          <div className="flex gap-1">
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
              disabled={!newChecklistItem}
            >
              Add
            </Button>
          </div>
        </>
      )}
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
    },
  });

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FaChevronDown
            onClick={() => setCollapsed(!collapsed)}
            className={`${collapsed ? "-rotate-90" : ""} transition-transform`}
          />
          <h3>Comments</h3>
        </div>
        {task.comments.length}
      </div>
      <hr />
      {!collapsed && (
        <>
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
                <span className="flex-grow">{comment.text}</span>
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
        </>
      )}
    </div>
  );
};
