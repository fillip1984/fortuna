"use client";

import type { PriorityOption } from "@prisma/client";
import { Check, ChevronDownIcon } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { GiLevelEndFlag } from "react-icons/gi";
import { TbTargetArrow } from "react-icons/tb";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import type { TaskType } from "~/server/types";
import { api } from "~/trpc/react";
import { Calendar } from "../ui/calendar";
import { BiCollection } from "react-icons/bi";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from "../ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";

export default function TaskModal({
  isOpen,
  dismiss,
  task,
}: {
  isOpen: boolean;
  dismiss: () => void;
  task?: TaskType;
}) {
  const { data: collections } = api.collection.findAll.useQuery();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [priority, setPriority] = useState<PriorityOption | undefined>();
  const [collection, setCollection] = useState<string>("");

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description ?? "");
      setDueDate(task.dueDate ? new Date(task.dueDate) : undefined);
      setPriority(task.priority ?? undefined);
      setCollection(
        task.collectionId
          ? (collections?.find((c) => c.id === task.collectionId)?.name ?? "")
          : "",
      );
    }
  }, [task, collections]);

  const utils = api.useUtils();
  const { mutateAsync: createTask } = api.task.create.useMutation({
    onSuccess: async () => {
      await utils.task.findAll.invalidate();
      resetForm();
      dismiss();
    },
  });
  const { mutateAsync: updateTask } = api.task.update.useMutation({
    onSuccess: async () => {
      await utils.task.findAll.invalidate();
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
  };

  const handleDismiss = () => {
    resetForm();
    dismiss();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    console.log("handleSubmit", { title, description });
    if (title) {
      if (task) {
        await updateTask({
          id: task.id,
          title,
          description,
          dueDate: dueDate ?? null,
          priority: priority ?? null,
        });
      } else {
        await createTask({
          title: title,
          description: description,
          dueDate: dueDate ?? null,
          priority: priority ?? null,
        });
      }
    }
  };
  return (
    <Dialog open={isOpen} onOpenChange={handleDismiss}>
      <DialogContent>
        <DialogTitle>{task ? "Edit Task" : "New Task"}</DialogTitle>
        <form onSubmit={handleSubmit} className="flex flex-col gap-2 p-4">
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
                  {collection ? (
                    <>
                      {collection}
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          setCollection("");
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
                        setCollection(c.name);
                        setCollectionPickerOpen(false);
                      }}
                      className="hover:bg-accent flex items-center justify-between gap-2 rounded-lg p-1"
                    >
                      {c.name}
                      {collection === c.name && (
                        <Check className="text-muted-foreground" />
                      )}
                    </div>
                  ))}
                </>
              </PopoverContent>
            </Popover>
          </div>
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
