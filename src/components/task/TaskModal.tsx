"use client";

import type { PriorityOption, RecurrenceOption } from "@prisma/client";
import { format } from "date-fns/format";
import { Check, ChevronDownIcon, LucideRepeat } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useContext, useEffect, useState } from "react";
import { BiCollection } from "react-icons/bi";
import { FaChevronDown, FaEllipsisH, FaTrash } from "react-icons/fa";
import { GiLevelEndFlag } from "react-icons/gi";
import { IoCloseSharp } from "react-icons/io5";
import { TbTargetArrow } from "react-icons/tb";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { AppContext } from "~/context/AppContextProvider";
import type { TaskType } from "~/server/types";
import { api } from "~/trpc/react";
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
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "../ui/input-group";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";

export default function TaskModal({
  isOpen,
  dismiss,
  task,
}: {
  isOpen: boolean;
  dismiss: () => void;
  task: TaskType;
}) {
  const utils = api.useUtils();
  const { mutateAsync: deleteTask } = api.task.delete.useMutation({
    onSuccess: async () => {
      await utils.task.findAll.invalidate();
      await utils.collection.findAll.invalidate();
      dismiss();
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={dismiss}>
      <DialogContent
        showCloseButton={false}
        className="m-0 flex h-[800px] flex-col gap-0 overflow-hidden p-0"
      >
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
          <Button variant="ghost" onClick={dismiss}>
            <IoCloseSharp />
          </Button>
        </div>
        <div className="flex flex-1 overflow-hidden">
          <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 pb-12">
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
  const [collectionId, setCollectionId] = useState<string | undefined>(
    undefined,
  );
  const [recurrence, setRecurrence] = useState<RecurrenceOption | null>(null);
  const [dailyFrequency, setDailyFrequency] = useState<number>();
  const [recurrenceSchedule, setRecurrenceSchedule] = useState([
    { label: "Sun", selected: false },
    { label: "Mon", selected: false },
    { label: "Tue", selected: false },
    { label: "Wed", selected: false },
    { label: "Thu", selected: false },
    { label: "Fri", selected: false },
    { label: "Sat", selected: false },
  ]);
  const [recurrenceMonthlySchedule, setRecurrenceMonthlySchedule] = useState(
    Array.from({ length: 31 }, (_, i) => ({
      label: (i + 1).toString(),
      selected: false,
    })),
  );
  useEffect(() => {
    if (recurrence === "Daily") {
      setRecurrenceSchedule((prev) =>
        prev.map((day) => ({ ...day, selected: true })),
      );
    } else if (recurrence === "Weekly") {
      setRecurrenceSchedule((prev) =>
        prev.map((day, index) => ({
          ...day,
          selected: index === new Date().getDay(),
        })),
      );
    } else if (recurrence === "Monthly") {
      setRecurrenceSchedule((prev) =>
        prev.map((day, index) => ({
          ...day,
          selected: index === new Date().getDate() - 1,
        })),
      );
    } else if (recurrence === "Yearly") {
      setRecurrenceSchedule((prev) =>
        prev.map((day, index) => ({
          ...day,
          selected:
            index ===
            Math.floor(
              (new Date().getMonth() * 30 + new Date().getDate() - 1) / 30,
            ),
        })),
      );
    } else {
      setRecurrenceSchedule((prev) =>
        prev.map((day) => ({ ...day, selected: false })),
      );
    }
  }, [recurrence]);

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const [month, setMonth] = useState("");

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description ?? "");
      setDueDate(task.dueDate ? new Date(task.dueDate) : undefined);
      setPriority(task.priority ?? undefined);
      setCollectionId(task.collectionId ?? undefined);
    }
  }, [task]);

  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [priorityPickerOpen, setPriorityPickerOpen] = useState(false);
  const [collectionPickerOpen, setCollectionPickerOpen] = useState(false);
  const [recurrencePickerOpen, setRecurrencePickerOpen] = useState(false);
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);

  const utils = api.useUtils();
  const { mutateAsync: updateTask } = api.task.update.useMutation({
    onSuccess: async () => {
      await utils.task.findAll.invalidate();
      await utils.collection.findAll.invalidate();
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
              />
              <div className="flex items-center gap-3">
                <TbTargetArrow className="h-5 w-5" />
                <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
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
                        void updateTask({
                          ...task,
                          dueDate: date ?? null,
                        });
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="flex items-center gap-3">
                <GiLevelEndFlag className="h-5 w-5" />
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
                              void updateTask({
                                ...task,
                                priority: null,
                              });
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
                      {["Urgent", "Important"].map((option) => (
                        <div
                          key={option}
                          onClick={() => {
                            setPriority(option as PriorityOption);
                            setPriorityPickerOpen(false);
                            void updateTask({
                              ...task,
                              priority: option as PriorityOption,
                            });
                          }}
                          className="hover:bg-accent flex items-center justify-between gap-2 rounded-lg p-1"
                        >
                          {option}
                          {priority === option && (
                            <Check className="text-muted-foreground" />
                          )}
                        </div>
                      ))}
                    </>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="flex items-center gap-3">
                <BiCollection className="h-5 w-5" />
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
                      {collectionId ? (
                        <>
                          {
                            collections.find((col) => col.id === collectionId)
                              ?.name
                          }
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              setCollectionId(undefined);
                              setCollectionPickerOpen(false);
                              void updateTask({
                                ...task,
                                collectionId: null,
                                order: 9999, // put it at the end of no collection
                              });
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
                            setCollectionId(c.id);
                            setCollectionPickerOpen(false);
                            void updateTask({
                              ...task,
                              collectionId: c.id,
                              // Handle putting item at the end of a collection if we move it to a new one
                              order:
                                task.collectionId === collectionId
                                  ? task.order
                                  : c._count.tasks,
                            });
                          }}
                          className="hover:bg-accent flex items-center justify-between gap-2 rounded-lg p-1"
                        >
                          {c.name}
                          {collectionId === c.id && (
                            <Check className="text-muted-foreground" />
                          )}
                        </div>
                      ))}
                    </>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex items-center gap-3">
                <LucideRepeat className="h-5 w-5" />
                <Popover
                  open={recurrencePickerOpen}
                  onOpenChange={setRecurrencePickerOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      id="collection"
                      className="w-48 justify-between font-normal"
                    >
                      {recurrence ? (
                        <>
                          {recurrence}
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              setRecurrence(null);
                              setRecurrencePickerOpen(false);
                            }}
                            className="text-muted-foreground"
                          >
                            x
                          </span>
                        </>
                      ) : (
                        <>
                          Select recurrence
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
                      {["Daily", "Weekly", "Monthly", "Yearly"].map(
                        (option) => (
                          <div
                            key={option}
                            onClick={() => {
                              setRecurrence(option as RecurrenceOption);
                              setRecurrencePickerOpen(false);
                            }}
                            className="hover:bg-accent flex items-center justify-between gap-2 rounded-lg p-1"
                          >
                            {option}
                            {recurrence === option && (
                              <Check className="text-muted-foreground" />
                            )}
                          </div>
                        ),
                      )}
                    </>
                  </PopoverContent>
                </Popover>
              </div>
              <span className="text-muted-foreground">
                Repeats every Thursday, Friday, and Saturday
              </span>
              {recurrence === "Daily" && (
                <div className="my-2 flex justify-center gap-2">
                  <InputGroup className="flex w-36 gap-2">
                    <InputGroupAddon align="inline-start">
                      Every
                    </InputGroupAddon>
                    <InputGroupInput
                      value={dailyFrequency}
                      onChange={(e) =>
                        setDailyFrequency(parseInt(e.target.value))
                      }
                    />
                    <InputGroupAddon align="inline-end">days</InputGroupAddon>
                  </InputGroup>
                </div>
              )}
              {recurrence === "Weekly" && (
                <div className="my-2 flex justify-center gap-2">
                  {recurrenceSchedule.map((day) => (
                    <span
                      key={day.label}
                      onClick={() => {
                        setRecurrenceSchedule((prev) =>
                          prev.map((d) =>
                            d.label === day.label
                              ? { ...d, selected: !d.selected }
                              : d,
                          ),
                        );
                      }}
                      className={`${day.selected ? "bg-primary text-black" : "text-muted-foreground"} flex h-8 w-8 items-center justify-center rounded-full border text-sm transition-colors duration-300 ease-in-out select-none`}
                    >
                      {day.label}
                    </span>
                  ))}
                </div>
              )}

              {recurrence === "Monthly" && (
                <div className="flex flex-col items-center select-none">
                  <div className="grid w-[300px] grid-cols-7 justify-center gap-2 text-center">
                    <span>Su</span>
                    <span>Mo</span>
                    <span>Tu</span>
                    <span>We</span>
                    <span>Th</span>
                    <span>Fr</span>
                    <span>Sa</span>
                  </div>
                  <div className="my-2 grid w-[300px] grid-cols-7 justify-center gap-2">
                    {recurrenceMonthlySchedule.map((day) => (
                      <span
                        key={day.label}
                        onClick={() => {
                          setRecurrenceMonthlySchedule((prev) =>
                            prev.map((d) =>
                              d.label === day.label
                                ? { ...d, selected: !d.selected }
                                : d,
                            ),
                          );
                        }}
                        className={`${day.selected ? "bg-primary text-black" : "text-muted-foreground"} flex h-8 w-8 items-center justify-center rounded-full border text-sm transition-colors duration-300 ease-in-out select-none`}
                      >
                        {day.label}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {recurrence === "Yearly" && (
                <div className="flex gap-2">
                  <InputGroup className="w-[150px]">
                    <InputGroupAddon align="inline-start">
                      On day
                    </InputGroupAddon>
                    <InputGroupInput
                      value={dailyFrequency}
                      onChange={(e) =>
                        setDailyFrequency(parseInt(e.target.value))
                      }
                    />
                    <InputGroupAddon align="inline-end">of</InputGroupAddon>
                  </InputGroup>
                  <Popover
                    open={monthPickerOpen}
                    onOpenChange={setMonthPickerOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        id="collection"
                        className="w-32 justify-between font-normal"
                      >
                        {month ? (
                          <>
                            {month}
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                setMonth("");
                                setMonthPickerOpen(false);
                              }}
                              className="text-muted-foreground"
                            >
                              x
                            </span>
                          </>
                        ) : (
                          <>
                            Select Month
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
                        {months.map((m) => (
                          <div
                            key={m}
                            onClick={() => {
                              setMonth(m);
                              setMonthPickerOpen(false);
                            }}
                            className="hover:bg-accent flex items-center justify-between gap-2 rounded-lg p-1"
                          >
                            {m}
                            {month === m && (
                              <Check className="text-muted-foreground" />
                            )}
                          </div>
                        ))}
                      </>
                    </PopoverContent>
                  </Popover>
                </div>
              )}
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
          </motion.div>
        )}
      </AnimatePresence>
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
