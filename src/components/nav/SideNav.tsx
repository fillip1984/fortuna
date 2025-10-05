"use client";

import { useContext, useState, type FormEvent } from "react";
import { FaPlus } from "react-icons/fa";
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

import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

import { AppContext } from "~/context/AppContextProvider";

export default function SideNav() {
  const { collections, activeCollectionId, setActiveCollectionId, sifters } =
    useContext(AppContext);

  const [isAddingCollection, setIsAddingCollection] = useState(false);

  return (
    <>
      <nav className="flex flex-col gap-2 overflow-hidden">
        <div className="flex flex-col gap-2 overflow-y-auto p-2 pb-12">
          <h4 className="mx-auto italic">fortuna</h4>
          <div className="grid w-[280px] grid-cols-1 gap-1 select-none md:grid-cols-2">
            {sifters.map((sifter) => (
              <div
                key={sifter.id}
                onClick={() => setActiveCollectionId(sifter.id)}
                className={`${activeCollectionId === sifter.id ? "bg-accent" : "hover:bg-accent/40"} flex items-center rounded-lg border px-2 py-1`}
              >
                <div className="flex flex-col gap-1">
                  {sifter.icon}
                  <p className="text-[10px]">{sifter.name}</p>
                </div>
                <h3 className="ml-auto text-2xl">{sifter.tasks.length ?? 0}</h3>
              </div>
            ))}
          </div>

          <h3>Collections</h3>
          <hr />
          <div className="ml-2 flex flex-col gap-1 select-none">
            {collections?.map((collection) => (
              <div
                key={collection.id}
                className={`${activeCollectionId === collection.id ? "bg-accent" : "hover:bg-accent/40"} flex justify-between rounded-lg p-1`}
                onClick={() => setActiveCollectionId(collection.id)}
              >
                {collection.name}
                <span>{collection._count.tasks}</span>
              </div>
            ))}
            <hr />
          </div>
          <Button
            onClick={() => setIsAddingCollection(true)}
            size={"sm"}
            variant="outline"
          >
            New Collection <FaPlus />
          </Button>
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
      await utils.collection.findAll.invalidate();
      dismiss();
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
