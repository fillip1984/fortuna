"use client";

import { useContext, useEffect, useState, type FormEvent } from "react";
import { FaPlus, FaSignOutAlt } from "react-icons/fa";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { api } from "~/trpc/react";

import { useDragAndDrop } from "@formkit/drag-and-drop/react";
import { Input } from "~/components/ui/input";

import { Label } from "~/components/ui/label";

import { AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";
import { Moon, Sun } from "lucide-react";
import { motion } from "motion/react";
import { useTheme } from "next-themes";
import { GrSystem } from "react-icons/gr";
import { AppContext } from "~/context/AppContextProvider";
import type { CollectionType } from "~/server/types";
import { Avatar } from "../ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Spinner } from "../ui/spinner";
import { authClient } from "~/server/auth/client";

export default function SideNav() {
  const { data: session } = authClient.useSession();
  const {
    isLoading,
    collections,
    activeCollection,
    setActiveCollection,
    sifters,
  } = useContext(AppContext);

  const [isAddingCollection, setIsAddingCollection] = useState(false);

  // theme stuff
  const { theme, setTheme } = useTheme();
  const handleThemeToggle = () => {
    setTheme((prevTheme) => {
      if (prevTheme === "light") return "dark";
      if (prevTheme === "dark") return "system";
      return "light";
    });
  };

  // DnD stuff
  const { mutate: reorderCollections } = api.collection.reorder.useMutation();
  const [
    draggableCollectionsParentRef,
    draggabledCollections,
    setDraggabledCollections,
  ] = useDragAndDrop<HTMLDivElement, CollectionType>([], {
    onDragend: (data) => {
      reorderCollections(
        data.values.map((section, index) => ({
          id: (section as CollectionType).id,
          order: index,
        })),
      );
    },
  });
  useEffect(() => {
    setDraggabledCollections(collections ?? []);
  }, [collections, setDraggabledCollections]);

  if (!session) {
    return null;
  }

  return (
    <>
      <nav className="flex shrink-0 flex-col gap-2 overflow-hidden">
        <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-2 pb-12">
          <h4 className="mx-auto italic">fortuna</h4>
          <div className="grid w-[280px] grid-cols-1 gap-1 select-none md:grid-cols-2">
            {sifters.map((sifter) => (
              <div
                key={sifter.id}
                onClick={() => setActiveCollection(sifter.id)}
                className={`${activeCollection && activeCollection.id === sifter.id ? "bg-accent" : "hover:bg-accent/40"} flex items-center rounded-lg border px-2 py-1`}
              >
                <div className="flex flex-col gap-1">
                  {sifter.icon}
                  <p className="text-[10px]">{sifter.name}</p>
                </div>
                <motion.div
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 0.4, times: [0, 0.5, 1] }}
                  key={sifter.tasks.length}
                  className="ml-auto text-2xl"
                >
                  {sifter.tasks.length ?? 0}
                </motion.div>
              </div>
            ))}
          </div>

          <div className="flex flex-1 flex-col overflow-y-auto">
            <h3>Collections</h3>
            <hr />
            {isLoading ? (
              <Spinner className="mx-auto" />
            ) : (
              <>
                <div
                  ref={draggableCollectionsParentRef}
                  className="ml-2 flex flex-col gap-1 select-none"
                >
                  {draggabledCollections?.map((collection) => (
                    <div
                      key={collection.id}
                      data-label={collection.id}
                      className={`${activeCollection?.id === collection.id ? "bg-accent" : "hover:bg-accent/40"} flex items-center justify-between rounded-lg px-2`}
                      onClick={() => setActiveCollection(collection.id)}
                    >
                      {collection.name}
                      <motion.div
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ duration: 0.4, times: [0, 0.5, 1] }}
                        key={collection.tasks.length}
                        className="text-2xl"
                      >
                        {collection.tasks.length}
                      </motion.div>
                    </div>
                  ))}
                  <hr />
                  <Button
                    onClick={() => setIsAddingCollection(true)}
                    size={"sm"}
                    variant="outline"
                  >
                    New Collection <FaPlus />
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center justify-center p-4">
          {session?.user.image && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Avatar className="select-none">
                  <AvatarImage src={session?.user.image} />
                  <AvatarFallback>{session?.user.name}</AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-36" align="start">
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    onClick={() => void authClient.signOut()}
                    className="justify-between"
                  >
                    Sign out <FaSignOutAlt />
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleThemeToggle}
                    className="justify-between"
                  >
                    Theme{" "}
                    {theme === "light" ? (
                      <Sun />
                    ) : theme === "dark" ? (
                      <Moon />
                    ) : (
                      <GrSystem />
                    )}
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </nav>
      <NewCollectionModal
        isOpen={isAddingCollection}
        dismiss={() => setIsAddingCollection(false)}
      />
    </>
  );
}

const NewCollectionModal = ({
  isOpen,
  dismiss,
}: {
  isOpen: boolean;
  dismiss: () => void;
}) => {
  const utils = api.useUtils();
  const { mutate: addCollection } = api.collection.create.useMutation({
    onSuccess: async () => {
      dismiss();
      await Promise.all([
        utils.task.findAll.invalidate(),
        utils.collection.findAll.invalidate(),
      ]);
    },
  });
  const [name, setName] = useState("");
  const handleAddCollection = (e: FormEvent) => {
    e.preventDefault();
    addCollection({ name });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && dismiss()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Collection</DialogTitle>
        </DialogHeader>
        <form
          id="add-collection-form"
          onSubmit={(e) => {
            handleAddCollection(e);
          }}
          className="grid gap-4"
        >
          <div className="grid gap-3">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        </form>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button form="add-collection-form" type="submit">
            Add
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
