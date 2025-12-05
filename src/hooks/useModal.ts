/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useState } from "react";

interface UseModalReturn<T = any> {
  isOpen: boolean;
  editableItem: T | null;
  show: () => void;
  hide: () => void;
  showWithItem: (item: T) => void;
}

/**
 * Custom hook to manage modal state.
 * @returns isOpen - state of modal, editableItem - currently editable item, show - function to open modal, hide - function to close modal, showWithItem - function to open modal with specific item
 */
export function useModal<T = any>(): UseModalReturn<T> {
  const [isOpen, setIsOpen] = useState(false);
  const [editableItem, setEditableItem] = useState<T | null>(null);

  const show = useCallback(() => {
    setIsOpen(true);
  }, []);

  const hide = useCallback(() => {
    setIsOpen(false);
    setEditableItem(null);
  }, []);

  const showWithItem = useCallback((item: T) => {
    setEditableItem(item);
    setIsOpen(true);
  }, []);

  return {
    isOpen,
    editableItem,
    show,
    hide,
    // setEditableItem, <-- can't think of a use for this yet
    showWithItem,
  };
}
