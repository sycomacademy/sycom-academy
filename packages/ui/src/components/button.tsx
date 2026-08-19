import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import * as React from "react";
import { Spinner } from "@sycom-learn/ui/components/spinner";
import { cn } from "@sycom-learn/ui/lib/utils";
import { type VariantProps } from "class-variance-authority";

import { buttonVariants } from "./button-variants";

export { buttonVariants };

export interface ButtonProps extends useRender.ComponentProps<"button"> {
  variant?: VariantProps<typeof buttonVariants>["variant"];
  size?: VariantProps<typeof buttonVariants>["size"];
  loading?: boolean;
}

function Button({
  className,
  variant,
  size,
  render,
  children,
  loading = false,
  disabled: disabledProp,
  ...props
}: ButtonProps): React.ReactElement {
  const isDisabled: boolean = Boolean(loading || disabledProp);
  const typeValue: React.ButtonHTMLAttributes<HTMLButtonElement>["type"] = render
    ? undefined
    : "button";
  const isIconSize = typeof size === "string" && size.startsWith("icon");

  const defaultProps = {
    children: (
      <>
        {isIconSize ? (
          loading && (
            <Spinner className="pointer-events-none" data-slot="button-loading-indicator" />
          )
        ) : (
          <span
            data-loading={loading ? "" : undefined}
            aria-hidden={!loading}
            className={cn(
              "group/spinner pointer-events-none grid items-center overflow-hidden",
              "grid-cols-[0fr] data-loading:grid-cols-[1fr]",
              "-me-(--button-gap,0) data-loading:me-0",
              "transition-[grid-template-columns,margin-inline-end] duration-220 ease-[cubic-bezier(0.23,1,0.32,1)]",
              "motion-reduce:transition-none",
            )}
          >
            <span
              className={cn(
                "flex min-w-0 scale-75 items-center opacity-0",
                "group-data-loading/spinner:scale-100 group-data-loading/spinner:opacity-100",
                "transition-[opacity,transform] duration-220 ease-[cubic-bezier(0.23,1,0.32,1)]",
                "motion-reduce:transition-none",
              )}
            >
              <Spinner data-slot="button-loading-indicator" />
            </span>
          </span>
        )}
        {children}
      </>
    ),
    className: cn(buttonVariants({ className, size, variant })),
    "aria-disabled": loading || undefined,
    "data-loading": loading ? "" : undefined,
    "data-slot": "button",
    disabled: isDisabled,
    type: typeValue,
  };

  return useRender({
    defaultTagName: "button",
    props: mergeProps<"button">(defaultProps, props),
    render,
  });
}

export { Button };
