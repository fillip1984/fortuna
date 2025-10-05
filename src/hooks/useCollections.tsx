import { useState } from "react";
import { api } from "~/trpc/react";

export const useCollections = () => {
  const { data: collections, refetch } = api.collection.findAll.useQuery();
  const [activeCollectionId, setActiveCollectionId] = useState<string | null>(
    null,
  );
  return { collections, activeCollectionId, setActiveCollectionId, refetch };
};
