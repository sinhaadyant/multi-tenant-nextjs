"use client";

import * as React from "react";
import { X, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface MultiSelectOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  selectedValues: string[];
  onSelectionChange: (values: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  className?: string;
  maxDisplay?: number;
}

export function MultiSelect({
  options,
  selectedValues,
  onSelectionChange,
  placeholder = "Select options...",
  searchPlaceholder = "Search options...",
  emptyMessage = "No options found.",
  disabled = false,
  className,
  maxDisplay = 3,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);

  const selectedOptions = options.filter(option =>
    selectedValues.includes(option.value)
  );

  const handleSelect = (value: string) => {
    const newSelection = selectedValues.includes(value)
      ? selectedValues.filter(v => v !== value)
      : [...selectedValues, value];
    onSelectionChange(newSelection);
  };

  const handleRemove = (value: string) => {
    onSelectionChange(selectedValues.filter(v => v !== value));
  };

  const displayCount = selectedValues.length - maxDisplay;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between",
            selectedValues.length > 0 && "border-primary",
            className
          )}
          disabled={disabled}
        >
          <div className="flex flex-wrap gap-1 max-w-full">
            {selectedValues.length === 0 ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : (
              <>
                {selectedOptions.slice(0, maxDisplay).map(option => (
                  <Badge
                    key={option.value}
                    variant="secondary"
                    className="mr-1 mb-1"
                  >
                    {option.label}
                    <button
                      className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      onKeyDown={e => {
                        if (e.key === "Enter") {
                          handleRemove(option.value);
                        }
                      }}
                      onMouseDown={e => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onClick={() => handleRemove(option.value)}
                    >
                      <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                    </button>
                  </Badge>
                ))}
                {displayCount > 0 && (
                  <Badge variant="secondary" className="mr-1 mb-1">
                    +{displayCount} more
                  </Badge>
                )}
              </>
            )}
          </div>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {options.map(option => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={() => handleSelect(option.value)}
                  disabled={option.disabled}
                >
                  <div
                    className={cn(
                      "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                      selectedValues.includes(option.value)
                        ? "bg-primary text-primary-foreground"
                        : "opacity-50 [&_svg]:invisible"
                    )}
                  >
                    <Check className={cn("h-4 w-4")} />
                  </div>
                  <div className="flex flex-col">
                    <span>{option.label}</span>
                    {option.description && (
                      <span className="text-sm text-muted-foreground">
                        {option.description}
                      </span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
