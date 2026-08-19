import { cn } from "@sycom-learn/ui/lib/utils";
import { useCallback, useState } from "react";

const GRID_SIZE = 10;

export type TableGridPickerProps = {
  /** Called with 1-based row and column counts (e.g. 3×4 table). */
  onSelect: (rows: number, cols: number) => void;
  className?: string;
};

export function TableGridPicker({ onSelect, className }: TableGridPickerProps) {
  const [hover, setHover] = useState({ rows: 0, cols: 0 });

  const resetHover = useCallback(() => setHover({ rows: 0, cols: 0 }), []);

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div
        className="inline-grid gap-0.5"
        style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))` }}
        onMouseLeave={resetHover}
      >
        {Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, index) => {
          const row = Math.floor(index / GRID_SIZE);
          const col = index % GRID_SIZE;
          const rows = row + 1;
          const cols = col + 1;
          const isHighlighted = row < hover.rows && col < hover.cols;
          return (
            <button
              key={`${row}-${col}`}
              type="button"
              aria-label={`Select ${rows} by ${cols} table`}
              className={cn(
                "size-4 rounded-sm border transition-colors",
                isHighlighted
                  ? "border-primary bg-primary"
                  : "border-muted-foreground/30 bg-muted/60 hover:bg-muted",
              )}
              onMouseEnter={() => setHover({ rows, cols })}
              onClick={() => onSelect(rows, cols)}
            />
          );
        })}
      </div>
      <p className="text-center text-xs text-muted-foreground tabular-nums">
        {hover.rows > 0 && hover.cols > 0
          ? `${hover.rows} × ${hover.cols} table`
          : "Hover to choose size"}
      </p>
    </div>
  );
}
