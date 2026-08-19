import { Field as FieldPrimitive } from "@base-ui/react/field";
import * as React from "react";
import { cn } from "@sycom-learn/ui/lib/utils";

export function Field({
  className,
  orientation = "vertical",
  ...props
}: FieldPrimitive.Root.Props & { orientation?: "horizontal" | "vertical" }): React.ReactElement {
  return (
    <FieldPrimitive.Root
      className={cn(
        orientation === "horizontal"
          ? "flex flex-row items-start gap-2"
          : "flex flex-col items-start gap-2",
        className,
      )}
      data-slot="field"
      {...props}
    />
  );
}

export function FieldLabel({
  className,
  ...props
}: FieldPrimitive.Label.Props): React.ReactElement {
  return (
    <FieldPrimitive.Label
      className={cn(
        "inline-flex items-center gap-2 text-base/4.5 font-medium text-foreground sm:text-sm/4 data-disabled:opacity-64",
        className,
      )}
      data-slot="field-label"
      {...props}
    />
  );
}

export function FieldItem({ className, ...props }: FieldPrimitive.Item.Props): React.ReactElement {
  return (
    <FieldPrimitive.Item className={cn("flex", className)} data-slot="field-item" {...props} />
  );
}

export function FieldDescription({
  className,
  ...props
}: FieldPrimitive.Description.Props): React.ReactElement {
  return (
    <FieldPrimitive.Description
      className={cn("text-xs text-muted-foreground", className)}
      data-slot="field-description"
      {...props}
    />
  );
}

/** Renders RHF (or other) error text. Base UI `Field.Error` only shows native/FormContext validity and drops `children`. */
export const FieldError = React.forwardRef(function FieldError(
  {
    className,
    reserveSpace,
    children,
    ...rest
  }: React.ComponentProps<"div"> & { reserveSpace?: boolean },
  ref: React.ForwardedRef<HTMLDivElement>,
) {
  const hasStringError = typeof children === "string" && children.trim() !== "";
  return (
    <div
      ref={ref}
      className={cn("text-xs text-destructive-foreground", reserveSpace && "min-h-5", className)}
      data-slot="field-error"
      role={hasStringError ? "alert" : undefined}
      {...rest}
    >
      {children}
    </div>
  );
});
FieldError.displayName = "FieldError";

export const FieldControl: typeof FieldPrimitive.Control = FieldPrimitive.Control;
export const FieldValidity: typeof FieldPrimitive.Validity = FieldPrimitive.Validity;

export { FieldPrimitive };
