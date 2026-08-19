import { CalendarIcon } from "lucide-react";
import * as React from "react";
import type { DateRange } from "react-day-picker";

import { Button, type ButtonProps } from "@sycom-learn/ui/components/button";
import { Calendar } from "@sycom-learn/ui/components/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@sycom-learn/ui/components/popover";
import { cn } from "@sycom-learn/ui/lib/utils";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

type CalendarProps = React.ComponentProps<typeof Calendar>;

export interface DatePickerProps extends Omit<
  CalendarProps,
  "defaultMonth" | "mode" | "numberOfMonths" | "onSelect" | "selected"
> {
  value?: DateRange;
  defaultValue?: DateRange;
  onValueChange?: (nextValue: DateRange | undefined) => void;
  placeholder?: string;
  buttonProps?: Omit<ButtonProps, "children" | "className" | "render">;
  className?: string;
  numberOfMonths?: number;
  clearLabel?: string;
}

function formatDateRange(value: DateRange | undefined): string {
  if (!value?.from) {
    return "";
  }

  if (!value.to) {
    return dateFormatter.format(value.from);
  }

  return `${dateFormatter.format(value.from)} - ${dateFormatter.format(value.to)}`;
}

export function DatePicker({
  value,
  defaultValue,
  onValueChange,
  placeholder = "Pick a date range",
  buttonProps,
  className,
  numberOfMonths = 2,
  clearLabel = "Clear",
  ...calendarProps
}: DatePickerProps): React.ReactElement {
  const [internalValue, setInternalValue] = React.useState<DateRange | undefined>(defaultValue);
  const selectedValue = value ?? internalValue;

  function handleSelect(nextValue: DateRange | undefined): void {
    if (value === undefined) {
      setInternalValue(nextValue);
    }

    onValueChange?.(nextValue);
  }

  function handleClear() {
    setInternalValue(undefined);
    onValueChange?.(undefined);
  }

  const label = formatDateRange(selectedValue);

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            className={cn(
              "w-full justify-start text-left font-normal",
              !selectedValue?.from && "text-muted-foreground",
              className,
            )}
            variant="outline"
            {...buttonProps}
          />
        }
      >
        <CalendarIcon aria-hidden="true" data-icon="inline-start" />
        {label || placeholder}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <div className="flex flex-col">
          <Calendar
            defaultMonth={selectedValue?.from}
            mode="range"
            numberOfMonths={numberOfMonths}
            onSelect={handleSelect}
            selected={selectedValue}
            {...calendarProps}
          />
          {clearLabel && (
            <div className="flex justify-end border-t px-2 py-2">
              <Button onClick={handleClear} size="sm" variant="ghost" disabled={!selectedValue}>
                {clearLabel}
              </Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
