"use client";

import { useContext, useState } from "react";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { AppContext } from "~/context/AppContextProvider";
import { api } from "~/trpc/react";
import { Spinner } from "../ui/spinner";

export default function NewTask() {
  const { activeCollection, collections } = useContext(AppContext);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const utils = api.useUtils();
  const { mutate: createTask, isPending } = api.task.create.useMutation({
    onSuccess: async () => {
      setTitle("");
      setDescription("");
      await Promise.all([
        utils.task.findAll.invalidate(),
        utils.collection.findAll.invalidate(),
      ]);
    },
  });

  const handleCreateTask = async () => {
    // default to specific things that make life easier,
    // such as if the Today sifter is active, default due date to today,
    // if a collection is active, default to that collection
    createTask({
      title,
      description,
      dueDate: activeCollection?.id === "Today" ? new Date() : null,
      priority:
        activeCollection?.id === "Urgent"
          ? "Urgent"
          : activeCollection?.id === "Unscheduled"
            ? "Important"
            : null,
      collectionId:
        collections?.find((c) => c.id === activeCollection?.id)?.id ?? null,
    });
  };

  return (
    <div className="mx-auto mt-4 flex w-1/2 min-w-100 flex-col gap-2 px-4">
      <Input
        placeholder="New task..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyUp={async (e) => {
          if (e.key === "Enter") {
            await handleCreateTask();
          }
        }}
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
        disabled={isPending || !title.trim()}
      >
        {isPending && <Spinner />}
        Add task...
      </Button>
    </div>
  );
}
