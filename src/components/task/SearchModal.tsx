"use client";

import React, { useEffect, useState } from "react";
import { useDebounce } from "@uidotdev/usehooks";
import { Search } from "lucide-react";

import { api } from "~/trpc/react";
import { Dialog, DialogContent } from "../ui/dialog";
import TaskRow from "./TaskRow";

interface SearchModalProps {
  isOpen: boolean;
  dismiss: () => void;
  onSelectTask?: (taskId: string) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  dismiss,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        dismiss();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, dismiss]);

  const { data: tasks } = api.task.search.useQuery(
    { query: debouncedSearchQuery },
    {
      enabled: debouncedSearchQuery.length > 0 && isOpen,
    },
  );

  if (!isOpen) return null;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          dismiss();
        }
      }}
    >
      <DialogContent>
        <div className="flex items-center border-b px-4 py-3">
          <Search className="mr-3 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="grow text-lg outline-none"
            autoFocus
          />
        </div>
        <div className="max-h-96 overflow-y-auto p-2">
          {!searchQuery && (
            <div className="py-8 text-center text-gray-500">
              Start typing to search...
              {searchQuery && tasks?.length === 0 && "No tasks found."}
            </div>
          )}
          {searchQuery && tasks?.length === 0 && (
            <div className="py-8 text-center text-gray-500">
              No tasks found.
            </div>
          )}
          {tasks?.map((task) => (
            <TaskRow key={task.id} task={task} />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const useSearchModal = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return { isOpen, setIsOpen };
};
