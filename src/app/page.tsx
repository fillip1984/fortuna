"use client";

import { useContext, useEffect, useState } from "react";

import { useDragAndDrop } from "@formkit/drag-and-drop/react";
import { AnimatePresence } from "motion/react";
import { FaEllipsisH, FaTrash } from "react-icons/fa";
import { GiBeerStein } from "react-icons/gi";
import NewTask from "~/components/task/NewTaskCard";
import TaskRow from "~/components/task/TaskRow";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "~/components/ui/empty";
import { AppContext } from "~/context/AppContextProvider";
import type { CollectionType, TaskType } from "~/server/types";
import { api } from "~/trpc/react";
import { Input } from "~/components/ui/input";

export default function Home() {
  const {
    filteredTasks,
    activeCollectionId,
    setActiveCollectionId,
    collections,
    showCompletedTasks,
    setShowCompletedTasks,
  } = useContext(AppContext);
  const [activeCollection, setActiveCollection] =
    useState<CollectionType | null>(null);

  useEffect(() => {
    if (activeCollectionId && collections) {
      const found = collections.find(
        (collection) => collection.id === activeCollectionId,
      );
      if (found) {
        setActiveCollection(found);
      } else {
        setActiveCollection(null);
      }
    }
  }, [activeCollectionId, collections]);

  // DnD stuff
  const { mutate: reorderTasks } = api.task.reorder.useMutation();
  const [draggableTasksParentRef, draggabledTasks, setDraggabledTasks] =
    useDragAndDrop<HTMLDivElement, TaskType>([], {
      onDragend: (data) => {
        reorderTasks(
          data.values.map((section, index) => ({
            id: (section as TaskType).id,
            order: index,
          })),
        );
      },
    });
  useEffect(() => {
    setDraggabledTasks(filteredTasks ?? []);
  }, [filteredTasks, setDraggabledTasks]);

  // collection stuff
  const utils = api.useUtils();
  const { mutateAsync: deleteCollection } = api.collection.delete.useMutation({
    onSuccess: async () => {
      setActiveCollectionId("Today");
      await utils.collection.findAll.invalidate();
      await utils.task.findAll.invalidate();
    },
  });

  // collection name stuff
  const [isRenaming, setIsRenaming] = useState(false);
  const [collectionName, setCollectionName] = useState("Untitled");
  useEffect(() => {
    if (activeCollection) {
      setCollectionName(activeCollection.name);
    }
  }, [activeCollection]);
  const collectionNameInputRef = (node: HTMLInputElement | null) => {
    if (node) {
      node.focus();
    }
  };
  const { mutateAsync: updateCollection } = api.collection.update.useMutation({
    onSuccess: async () => {
      await utils.collection.findAll.invalidate();
      await utils.task.findAll.invalidate();
      setIsRenaming(false);
    },
  });

  return (
    <div className="flex h-screen flex-col overflow-y-auto pb-12">
      <div className="flex items-center justify-between border-b p-4">
        <div>
          {!isRenaming && activeCollection ? (
            <h3
              className="text-2xl font-bold"
              onClick={() => setIsRenaming(true)}
            >
              {collectionName}
            </h3>
          ) : (
            <Input
              ref={collectionNameInputRef}
              value={collectionName}
              onChange={(e) => {
                setCollectionName(e.target.value);
              }}
              onBlur={() =>
                updateCollection({
                  ...activeCollection!,
                  name: collectionName ?? "Untitled",
                })
              }
              placeholder="Collection name..."
            />
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost">
              <FaEllipsisH />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-40" align="start">
            <DropdownMenuCheckboxItem
              checked={showCompletedTasks}
              onCheckedChange={setShowCompletedTasks}
              className="text-xs"
            >
              Show Completed
            </DropdownMenuCheckboxItem>
            {activeCollection && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    onClick={() =>
                      void deleteCollection({ id: activeCollection.id })
                    }
                    className="text-destructive justify-between"
                  >
                    Delete <FaTrash className="text-destructive" />
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {filteredTasks?.length > 0 ? (
        <>
          <div ref={draggableTasksParentRef} className="flex flex-col">
            <AnimatePresence>
              {draggabledTasks.map((task) => (
                <TaskRow key={task.id} data-label={task.id} task={task} />
              ))}
            </AnimatePresence>
          </div>
          <NewTask />
        </>
      ) : (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <GiBeerStein />
            </EmptyMedia>
            <EmptyTitle>No Tasks Found...</EmptyTitle>
            <EmptyDescription>
              Either you&apos;ve completed them all or there are no activities
              for the filter/collection you selected.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <div className="w-full">
              <NewTask />
            </div>
          </EmptyContent>
        </Empty>
      )}
    </div>
  );
}
