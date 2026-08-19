import { Trash2, X } from "lucide-react";
import React, { type ChangeEvent, type FormEvent } from "react";

import { Button, type ButtonProps } from "@sycom-learn/ui/components/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@sycom-learn/ui/components/field";
import { Input } from "@sycom-learn/ui/components/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@sycom-learn/ui/components/tooltip";
import { cn } from "@sycom-learn/ui/lib/utils";
import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverTrigger,
} from "@sycom-learn/ui/components/popover";
import { useToolbar, useToolbarEditorState } from "./toolbar-provider";
import { getUrlFromString } from "@sycom-learn/ui/lib/tiptap-utils";

const INVALID_LINK_MESSAGE = "Enter a valid URL, like https://example.com.";

const LinkToolbar = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, ...props }, ref) => {
    const { editor } = useToolbar();
    const linkState = useToolbarEditorState((currentEditor) => ({
      isActive: currentEditor.isActive("link"),
      href: (currentEditor.getAttributes("link") as { href?: string }).href ?? "",
      canEdit: currentEditor.isEditable,
    }));
    const [open, setOpen] = React.useState(false);
    const [link, setLink] = React.useState("");
    const [error, setError] = React.useState<string | undefined>();

    React.useEffect(() => {
      if (!open) {
        setLink(linkState.href);
        setError(undefined);
      }
    }, [linkState.href, open]);

    const handleSubmit = (event: FormEvent) => {
      event.preventDefault();

      const href = getUrlFromString(link.trim());
      if (!href) {
        setError(INVALID_LINK_MESSAGE);
        return;
      }

      editor?.chain().focus().setLink({ href }).run();
      setOpen(false);
    };

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
      setLink(event.target.value);
      if (error) {
        setError(undefined);
      }
    };

    return (
      <span className="inline-flex shrink-0">
        <Popover onOpenChange={setOpen} open={open}>
          <Tooltip>
            <TooltipTrigger
              render={
                <PopoverTrigger
                  disabled={!linkState.canEdit}
                  render={
                    <Button
                      className={cn(
                        "h-8 w-max px-3 font-normal",
                        linkState.isActive && "bg-accent text-accent-foreground",
                        className,
                      )}
                      ref={ref}
                      size="sm"
                      variant="ghost"
                      {...props}
                    />
                  }
                />
              }
            >
              <p className="mr-2 text-base">↗</p>
              <p className="underline underline-offset-4">Link</p>
            </TooltipTrigger>
            <TooltipContent>
              <span>Link</span>
            </TooltipContent>
          </Tooltip>

          <PopoverContent className="relative p-1" render={<div className="relative" />}>
            <PopoverClose className="absolute top-2 right-2">
              <X className="h-4 w-4" />
            </PopoverClose>

            <form className="w-72 space-y-3" onSubmit={handleSubmit}>
              <Field>
                <FieldLabel className="text-xs">Link</FieldLabel>
                <FieldDescription>Attach a link to the selected text.</FieldDescription>
                <Input
                  aria-invalid={error ? true : undefined}
                  className="w-full"
                  onChange={handleChange}
                  placeholder="https://example.com"
                  size="sm"
                  value={link}
                />
                <FieldError reserveSpace>{error}</FieldError>
              </Field>

              <div className="flex items-center justify-end gap-2">
                {linkState.href ? (
                  <Button
                    className="h-7"
                    onClick={() => {
                      editor?.chain().focus().unsetLink().run();
                      setOpen(false);
                    }}
                    size="sm"
                    type="button"
                    variant="ghost"
                  >
                    <Trash2 className="mr-2 h-3.5 w-3.5" />
                    Remove
                  </Button>
                ) : null}

                <Button className="h-7" size="sm" type="submit">
                  {linkState.href ? "Update" : "Confirm"}
                </Button>
              </div>
            </form>
          </PopoverContent>
        </Popover>
      </span>
    );
  },
);

LinkToolbar.displayName = "LinkToolbar";

export { LinkToolbar };
