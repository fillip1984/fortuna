"use client";

import { useContext, useState } from "react";

import { Button } from "~/components/ui/button";
import { AppContext } from "~/context/AppContextProvider";

import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { api } from "~/trpc/react";

export default function NewTask() {
  const { collections, activeCollectionId } = useContext(AppContext);

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
      collectionId:
        collections.find((c) => activeCollectionId === c.id)?.id ?? null,
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
}
