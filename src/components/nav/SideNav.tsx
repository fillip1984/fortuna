"use client";

import { useState, type FormEvent } from "react";
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
import Link from "next/link";

export default function SideNav() {
  const { data: collections } = api.collection.findAll.useQuery();
  const [isAddingCollection, setIsAddingCollection] = useState(false);

  return (
    <>
      <div className="flex flex-col gap-2">
        <h4 className="mx-auto italic">fortuna</h4>

        <h3>Collections</h3>
        <hr />
        <div className="ml-2 flex flex-col gap-1">
          {collections?.map((collection) => (
            <Link href={`/collections/${collection.id}`} key={collection.id}>
              {collection.name}
            </Link>
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
    console.log("handleAddCollection");
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
            console.log("submitting");
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
