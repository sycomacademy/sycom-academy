import { CheckIcon, ChevronDownIcon } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@sycom-learn/ui/components/button";
import { Checkbox } from "@sycom-learn/ui/components/checkbox";
import {
  Combobox,
  ComboboxInput,
  ComboboxList,
  ComboboxPopup,
  ComboboxPrimitive,
  ComboboxTrigger,
  ComboboxValue,
} from "@sycom-learn/ui/components/combobox";
import { cn } from "@sycom-learn/ui/lib/utils";

export type FilterOption = { value: string; label: string };

export type FilterComboboxProps = {
  label: string;
  options: FilterOption[];
  value: string[];
  onValueChange: (next: string[]) => void;
  resetWhenAllSelected?: boolean;
  searchPlaceholder?: string;
  align?: "start" | "center" | "end";
  formatTriggerLabel?: (label: string, selected: FilterOption[]) => ReactNode;
  allLabel?: string;
  className?: string;
  size?: "sm" | "default" | "lg" | "xs" | "icon" | "icon-xs" | "icon-sm" | "icon-lg";
};

function buildDefaultFormatter(allLabel?: string) {
  return (label: string, selected: FilterOption[]): ReactNode => {
    if (selected.length === 0) return allLabel ? `${label}: ${allLabel}` : label;
    if (selected.length === 1) return `${label}: ${selected[0]?.label ?? ""}`;
    return `${label}: ${selected.length} selected`;
  };
}

export function FilterCombobox({
  align = "start",
  allLabel,
  className,
  formatTriggerLabel,
  label,
  onValueChange,
  options,
  resetWhenAllSelected = true,
  searchPlaceholder,
  size = "sm",
  value,
}: FilterComboboxProps): ReactNode {
  const format = formatTriggerLabel ?? buildDefaultFormatter(allLabel);
  const selectedOptions = options.filter((o) => value.includes(o.value));

  const handleChange = (next: FilterOption[]) => {
    const nextValues = next.map((o) => o.value);
    if (resetWhenAllSelected && options.length > 0 && nextValues.length === options.length) {
      onValueChange([]);
      return;
    }
    onValueChange(nextValues);
  };

  return (
    <Combobox
      items={options}
      itemToStringLabel={(item: FilterOption) => item.label}
      multiple
      onValueChange={handleChange}
      value={selectedOptions}
    >
      <ComboboxTrigger
        render={
          <Button
            className={cn("w-44 justify-between gap-2", className)}
            size={size}
            variant="outline"
          />
        }
      >
        <ComboboxValue>
          {(selected: FilterOption[]) => (
            <span className="min-w-0 flex-1 truncate text-start">{format(label, selected)}</span>
          )}
        </ComboboxValue>
        <ChevronDownIcon className="size-4 shrink-0 opacity-60" />
      </ComboboxTrigger>

      <ComboboxPopup align={align} className="w-64">
        <div className="border-b p-2">
          <ComboboxInput
            placeholder={searchPlaceholder ?? `Search ${label.toLowerCase()}…`}
            showTrigger={false}
            size="sm"
          />
        </div>
        <div className="flex justify-end gap-2 px-2 pt-1">
          {!resetWhenAllSelected && options.length > 0 ? (
            <Button
              disabled={value.length === options.length}
              onClick={() => onValueChange(options.map((o) => o.value))}
              size="sm"
              variant="link"
            >
              All
            </Button>
          ) : null}
          <Button
            disabled={value.length === 0}
            onClick={() => onValueChange([])}
            size="sm"
            variant="link"
          >
            Reset
          </Button>
        </div>
        <ComboboxList>
          {(item: FilterOption) => (
            <ComboboxPrimitive.Item
              className={cn(
                "grid cursor-default grid-cols-[auto_1fr_auto] items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none",
                "data-highlighted:bg-accent data-highlighted:text-accent-foreground",
              )}
              key={item.value}
              value={item}
            >
              <Checkbox aria-hidden checked={value.includes(item.value)} tabIndex={-1} />
              <span>{item.label}</span>
              <ComboboxPrimitive.ItemIndicator>
                <CheckIcon className="size-4" />
              </ComboboxPrimitive.ItemIndicator>
            </ComboboxPrimitive.Item>
          )}
        </ComboboxList>
      </ComboboxPopup>
    </Combobox>
  );
}
