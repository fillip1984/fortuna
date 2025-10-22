"use client";

import type {
  CompleteOptionType,
  PriorityOption,
  RecurrenceOption,
} from "@prisma/client";
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

import { useDragAndDrop } from "@formkit/drag-and-drop/react";
import { addDays, startOfDay } from "date-fns";
import { GrTrophy } from "react-icons/gr";
import type { ChecklistItemType, TaskType } from "~/server/types";
import { api } from "~/trpc/react";
import { calculateNextDueDate } from "~/utils/date";
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
import { CopyButton } from "../ui/shadcn-io/copy-button";

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
      dismiss();
      await Promise.all([
        utils.task.findAll.invalidate(),
        utils.collection.findAll.invalidate(),
      ]);
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
  const [onComplete, setOnComplete] = useState<string | null>(null);
  const [recurrence, setRecurrence] = useState<RecurrenceOption | null>(null);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description ?? "");
      setDueDate(task.dueDate ? new Date(task.dueDate) : undefined);
      setPriority(task.priority ?? undefined);
      setCollectionId(task.collectionId ?? undefined);
      setOnComplete(task.onComplete?.replaceAll("_", " ") ?? null);
      setRecurrence(task.recurrence ?? null);
    }
  }, [task]);

  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [priorityPickerOpen, setPriorityPickerOpen] = useState(false);
  const [collectionPickerOpen, setCollectionPickerOpen] = useState(false);
  const [onCompletePickerOpen, setOnCompletePickerOpen] = useState(false);
  const [recurrencePickerOpen, setRecurrencePickerOpen] = useState(false);

  const utils = api.useUtils();
  const { mutateAsync: updateTask } = api.task.update.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.task.findAll.invalidate(),
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
                          dueDate: date ? startOfDay(date) : null,
                        });
                      }}
                    />
                  </PopoverContent>
                </Popover>
                {task.nextDueDate && (
                  <span className="text-muted-foreground text-sm">
                    Next Due Date: {task.nextDueDate.toLocaleDateString()}
                  </span>
                )}
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
                                  : c.tasks.length + 1,
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
                <GrTrophy className="h-5 w-5" />
                <Popover
                  open={onCompletePickerOpen}
                  onOpenChange={setOnCompletePickerOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      id="collection"
                      className="w-48 justify-between font-normal"
                    >
                      {onComplete ? (
                        <>
                          {onComplete}
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              setOnComplete(null);
                              setOnCompletePickerOpen(false);
                              void updateTask({
                                ...task,
                                onComplete: null,
                              });
                            }}
                            className="text-muted-foreground"
                          >
                            x
                          </span>
                        </>
                      ) : (
                        <>
                          Select outcome view
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
                      {[
                        // "Simple",
                        // "Note",
                        "Weigh in",
                        "Blood pressure reading",
                        // "Runners log",
                      ].map((option) => (
                        <div
                          key={option}
                          onClick={() => {
                            setOnComplete(option as CompleteOptionType);
                            setOnCompletePickerOpen(false);
                            void updateTask({
                              ...task,
                              onComplete: option.replaceAll(
                                " ",
                                "_",
                              ) as CompleteOptionType,
                            });
                          }}
                          className="hover:bg-accent flex items-center justify-between gap-2 rounded-lg p-1"
                        >
                          {option}
                          {onComplete === option && (
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
                              void updateTask({
                                ...task,
                                recurrence: null,
                                frequency: null,
                                nextDueDate: null,
                              });
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
                              void updateTask({
                                ...task,
                                recurrence: option as RecurrenceOption,
                                frequency: null,
                                nextDueDate: null,
                              });
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
              {recurrence && (
                <RecurrenceSection task={task} recurrence={recurrence} />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const RecurrenceSection = ({
  task,
  recurrence,
}: {
  task: TaskType;
  recurrence: RecurrenceOption | null;
}) => {
  const [dailyFrequency, setDailyFrequency] = useState<number | null>(null);
  const [weeklyFrequency, setWeeklyFrequency] = useState([
    { label: "Sun", selected: false },
    { label: "Mon", selected: false },
    { label: "Tue", selected: false },
    { label: "Wed", selected: false },
    { label: "Thu", selected: false },
    { label: "Fri", selected: false },
    { label: "Sat", selected: false },
  ]);
  const [monthlyFrequency, setMonthlyFrequency] = useState(() =>
    Array.from({ length: 31 }, (_, i) => ({
      label: String(i + 1),
      selected: false,
    })),
  );
  const [yearlyFrequency, setYearlyFrequency] = useState({
    month: "",
    day: "",
  });
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);

  useEffect(() => {
    if (recurrence === "Daily") {
      setDailyFrequency(task.frequency ? parseInt(task.frequency) : null);
    } else if (recurrence === "Weekly") {
      setWeeklyFrequency((prev) =>
        prev.map((day) => ({
          ...day,
          selected: task.frequency
            ? task.frequency.split(",").includes(day.label)
            : false,
        })),
      );
    } else if (recurrence === "Monthly") {
      setMonthlyFrequency((prev) =>
        prev.map((d) =>
          d.label === d.label ? { ...d, selected: !d.selected } : d,
        ),
      );
    } else if (recurrence === "Yearly") {
      setYearlyFrequency({
        month: task.frequency?.split("-")[0] ?? "",
        day: task.frequency?.split("-")[1] ?? "",
      });
    }
  }, [recurrence, task.frequency]);

  const utils = api.useUtils();
  const { mutateAsync: updateTask } = api.task.update.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.task.findAll.invalidate(),
        utils.collection.findAll.invalidate(),
      ]);
    },
  });

  return (
    <>
      {recurrence === "Daily" && (
        <div className="my-2 flex justify-center gap-2">
          <InputGroup className="flex w-36 gap-2">
            <InputGroupAddon align="inline-start">Every</InputGroupAddon>
            <InputGroupInput
              value={dailyFrequency ?? ""}
              onChange={(e) => setDailyFrequency(parseInt(e.target.value))}
              onBlur={() => {
                void updateTask({
                  ...task,
                  frequency: dailyFrequency?.toString() ?? "",
                  nextDueDate: calculateNextDueDate({
                    recurrence: "Daily",
                    frequency: dailyFrequency?.toString() ?? "",
                    currentDueDate: task.dueDate ?? new Date(),
                  }),
                });
              }}
            />
            <InputGroupAddon align="inline-end">days</InputGroupAddon>
          </InputGroup>
        </div>
      )}
      {recurrence === "Weekly" && (
        <div className="my-2 flex justify-center gap-2">
          {weeklyFrequency.map((day) => (
            <span
              key={day.label}
              onClick={() => {
                const updatedWeeklyFrequency = weeklyFrequency.map((d) =>
                  d.label === day.label ? { ...d, selected: !d.selected } : d,
                );
                setWeeklyFrequency(updatedWeeklyFrequency);

                const nextDueDate = calculateNextDueDate({
                  recurrence: "Weekly",
                  frequency: updatedWeeklyFrequency.reduce<string>(
                    (acc, d) =>
                      d.selected ? (acc ? `${acc},${d.label}` : d.label) : acc,
                    "",
                  ),
                  currentDueDate: task.dueDate ?? new Date(),
                });

                void updateTask({
                  ...task,
                  frequency: updatedWeeklyFrequency.reduce<string>(
                    (acc, d) =>
                      d.selected ? (acc ? `${acc},${d.label}` : d.label) : acc,
                    "",
                  ),
                  dueDate: task.dueDate ?? nextDueDate,
                  nextDueDate: nextDueDate,
                });
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
            {monthlyFrequency.map((day) => (
              <span
                key={day.label}
                onClick={() => {
                  const updatedMonthlyFrequency = monthlyFrequency.map((d) =>
                    d.label === day.label ? { ...d, selected: !d.selected } : d,
                  );
                  setMonthlyFrequency(updatedMonthlyFrequency);
                  void updateTask({
                    ...task,
                    frequency: updatedMonthlyFrequency.reduce<string>(
                      (acc, d) =>
                        d.selected
                          ? acc
                            ? `${acc},${d.label}`
                            : d.label
                          : acc,
                      "",
                    ),
                    nextDueDate: task.dueDate
                      ? addDays(
                          startOfDay(task.dueDate),
                          30 -
                            ((task.dueDate.getDate() -
                              updatedMonthlyFrequency.findIndex(
                                (d) => d.label === day.label,
                              ) +
                              31) %
                              31),
                        )
                      : null,
                  });
                }}
                className={`${
                  day.selected
                    ? "bg-primary text-black"
                    : "text-muted-foreground"
                } flex h-8 w-8 items-center justify-center rounded-full border text-sm transition-colors duration-300 ease-in-out select-none`}
              >
                {day.label}
              </span>
            ))}
          </div>
        </div>
      )}
      {recurrence === "Yearly" && (
        <div className="flex justify-center gap-2">
          <InputGroup className="w-[150px]">
            <InputGroupAddon align="inline-start">On day</InputGroupAddon>
            <InputGroupInput
              value={yearlyFrequency.day}
              onChange={(e) =>
                setYearlyFrequency({
                  ...yearlyFrequency,
                  day: e.target.value,
                })
              }
              onBlur={() => {
                if (!yearlyFrequency.month || !yearlyFrequency.day) return;
                void updateTask({
                  ...task,
                  frequency: yearlyFrequency.month + "-" + yearlyFrequency.day,
                  nextDueDate: task.dueDate
                    ? addDays(
                        startOfDay(task.dueDate),
                        365 -
                          (task.dueDate.getMonth() * 30 +
                            task.dueDate.getDate() -
                            1) /
                            30,
                      )
                    : null,
                });
              }}
            />
            <InputGroupAddon align="inline-end">of</InputGroupAddon>
          </InputGroup>
          <Popover open={monthPickerOpen} onOpenChange={setMonthPickerOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                id="collection"
                className="w-32 justify-between font-normal"
              >
                {yearlyFrequency.month ? (
                  <>
                    {yearlyFrequency.month}
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        setYearlyFrequency({
                          ...yearlyFrequency,
                          month: "",
                        });
                        setMonthPickerOpen(false);
                        void updateTask({
                          ...task,
                          frequency: null,
                          nextDueDate: null,
                        });
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
            <PopoverContent className="w-48 overflow-hidden p-2" align="center">
              <>
                {[
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
                ].map((m) => (
                  <div
                    key={m}
                    onClick={() => {
                      setYearlyFrequency({
                        ...yearlyFrequency,
                        month: m,
                      });
                      setMonthPickerOpen(false);
                      if (!m || !yearlyFrequency.day) return;
                      void updateTask({
                        ...task,
                        frequency: m + "-" + yearlyFrequency.day,
                        nextDueDate: task.dueDate
                          ? addDays(
                              startOfDay(task.dueDate),
                              365 -
                                (task.dueDate.getMonth() * 30 +
                                  task.dueDate.getDate() -
                                  1) /
                                  30,
                            )
                          : null,
                      });
                    }}
                    className="hover:bg-accent flex items-center justify-between gap-2 rounded-lg p-1"
                  >
                    {m}
                    {yearlyFrequency.month === m && (
                      <Check className="text-muted-foreground" />
                    )}
                  </div>
                ))}
              </>
            </PopoverContent>
          </Popover>
        </div>
      )}
    </>
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
          utils.collection.findAll.invalidate(),
        ]);
      },
    });

  const { mutateAsync: deleteChecklistItem } =
    api.task.deleteChecklistItem.useMutation({
      onSuccess: async () => {
        await Promise.all([
          utils.task.findAll.invalidate(),
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
