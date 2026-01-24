"use client";

import { useState } from "react";
import { cva } from "class-variance-authority";
import { Check, ChevronDownIcon } from "lucide-react";

import { cn } from "~/lib/utils";
import { Button } from "../ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";

const comboboxVariants = cva("justify-between font-normal");

{
  /* TODO: replace custom combobox with shadcn once bugs cool down, currently you can't select items if the combobox is on a dialog */
}
export default function Combobox({
  value,
  setValue,
  options,
  searchable,
  placeholder,
  className,
  ...props
}: React.ComponentProps<"button"> & {
  value: string | null | undefined;
  setValue: (value: string | null) => void;
  options: { id: string | null; label: string }[];
  searchable?: boolean;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(comboboxVariants({ className }))}
          {...props}
        >
          {/* show placeholder when no value selected */}
          {value ? (
            options.find((o) => o.id === value)?.label
          ) : (
            <span className="text-muted-foreground">
              {placeholder ?? "Select an option"}
            </span>
          )}

          {/* sets chip at end, either x (to clear value) or chevron (to indicate dropdown) */}
          {value ? (
            <span
              onClick={(e) => {
                e.stopPropagation();
                setValue(null);
              }}
              className="text-muted-foreground"
            >
              x
            </span>
          ) : (
            <ChevronDownIcon />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto overflow-hidden p-0" align="start">
        <Command>
          {searchable && (
            <CommandInput placeholder="Search..." className="h-9" />
          )}
          <CommandList>
            <CommandEmpty>No options found</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.id}
                  value={option.id ?? ""}
                  onSelect={(currentValue) => {
                    setValue(currentValue === value ? null : currentValue);
                    setOpen(false);
                  }}
                >
                  {option.label}
                  <Check
                    className={cn(
                      "ml-auto",
                      option.id === value ? "opacity-100" : "opacity-0",
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
