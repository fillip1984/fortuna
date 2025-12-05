import type { CollectionType, SifterType } from "~/server/types";

/**
 * Checks if collection is deletable
 * 
 * We shouldn't allow sifters to be deleted
 * 
 * @param collection 
 * @returns 
 */
export const isDeletable = (collection: SifterType | CollectionType) => {
    return !(collection as SifterType).protected
}