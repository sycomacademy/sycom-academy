import { Spinner } from "@sycom-learn/ui/components/kibo-ui/spinner/index";
import { cn } from "@sycom-learn/ui/lib/utils";

type LoaderMode = "screen" | "container";

type LoaderProps = {
  mode?: LoaderMode;
  text?: string;
  className?: string;
  spinnerClassName?: string;
  textClassName?: string;
};

/**
 * Centered full-size loading surface for route `pendingComponent` and similar.
 */
export function Loader({
  mode = "container",
  text = "Loading",
  className,
  spinnerClassName,
  textClassName,
}: LoaderProps) {
  return (
    <div
      className={cn(
        "flex size-full flex-col items-center justify-center gap-2",
        mode === "screen" ? "min-h-screen" : "min-h-40",
        className,
      )}
    >
      <Spinner className={cn("size-6 text-muted-foreground", spinnerClassName)} variant="bars" />
      <p className={cn("text-sm text-muted-foreground", textClassName)}>{text}</p>
    </div>
  );
}
