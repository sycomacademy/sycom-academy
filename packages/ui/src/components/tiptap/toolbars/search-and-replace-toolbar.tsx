import { ArrowLeftIcon, ArrowRightIcon, X, Repeat } from "lucide-react";
import { useEffect, useState, type ChangeEvent } from "react";

import { Button } from "@sycom-learn/ui/components/button";
import { Checkbox } from "@sycom-learn/ui/components/checkbox";
import { Input } from "@sycom-learn/ui/components/input";
import { Label } from "@sycom-learn/ui/components/label";
import { Popover, PopoverContent, PopoverTrigger } from "@sycom-learn/ui/components/popover";
import { Separator } from "@sycom-learn/ui/components/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@sycom-learn/ui/components/tooltip";
import { cn } from "@sycom-learn/ui/lib/utils";
import { useToolbar, useToolbarEditorState } from "./toolbar-provider";
import { type SearchAndReplaceStorage } from "../extensions/search-and-replace";

export function SearchAndReplaceToolbar() {
  const { editor } = useToolbar();
  const searchState = useToolbarEditorState((currentEditor) => ({
    canOpen: currentEditor.isEditable,
    results: currentEditor.storage.searchAndReplace.results,
    selectedResult: currentEditor.storage.searchAndReplace.selectedResult,
    searchTerm: currentEditor.storage.searchAndReplace.searchTerm,
    replaceTerm: currentEditor.storage.searchAndReplace.replaceTerm,
    caseSensitive: currentEditor.storage.searchAndReplace.caseSensitive,
  }));

  const [open, setOpen] = useState(false);
  const [replacing, setReplacing] = useState(false);
  const [searchText, setSearchText] = useState(searchState.searchTerm);
  const [replaceText, setReplaceText] = useState(searchState.replaceTerm);
  const [checked, setChecked] = useState(searchState.caseSensitive);

  const results = searchState.results as SearchAndReplaceStorage["results"];
  const selectedResult = searchState.selectedResult as SearchAndReplaceStorage["selectedResult"];
  const resultCount = results.length;
  const resultLabel = `${resultCount === 0 ? 0 : selectedResult + 1}/${resultCount}`;

  const replace = () => editor?.chain().replace().run();
  const replaceAll = () => editor?.chain().replaceAll().run();
  const selectNext = () => editor?.chain().selectNextResult().run();
  const selectPrevious = () => editor?.chain().selectPreviousResult().run();

  useEffect(() => {
    if (!open) {
      setSearchText(searchState.searchTerm);
      setReplaceText(searchState.replaceTerm);
      setChecked(searchState.caseSensitive);
    }
  }, [open, searchState.caseSensitive, searchState.replaceTerm, searchState.searchTerm]);

  useEffect(() => {
    editor?.chain().setSearchTerm(searchText).run();
  }, [searchText, editor]);

  useEffect(() => {
    editor?.chain().setReplaceTerm(replaceText).run();
  }, [replaceText, editor]);

  useEffect(() => {
    editor?.chain().setCaseSensitive(checked).run();
  }, [checked, editor]);

  useEffect(() => {
    if (!open) {
      setReplaceText("");
      setSearchText("");
      setReplacing(false);
    }
  }, [open]);

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <Tooltip>
        <TooltipTrigger
          render={
            <PopoverTrigger
              disabled={!searchState.canOpen}
              render={
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setOpen(!open);
                  }}
                  className={cn("h-8 w-max px-3 font-normal")}
                />
              }
            />
          }
        >
          <Repeat className="mr-2 h-4 w-4" />
          <p>Search & Replace</p>
        </TooltipTrigger>
        <TooltipContent>
          <span>Search & Replace</span>
        </TooltipContent>
      </Tooltip>

      <PopoverContent align="end" className="relative flex w-[400px] px-3 py-2.5">
        {!replacing ? (
          <div className={cn("relative flex items-center gap-1.5")}>
            <Input
              value={searchText}
              className="w-48"
              onChange={(event: ChangeEvent<HTMLInputElement>) => {
                setSearchText(event.target.value);
              }}
              placeholder="Search..."
            />
            <span>{resultLabel}</span>
            <Button
              disabled={resultCount === 0}
              onClick={selectPrevious}
              size="icon"
              variant="ghost"
              className="size-7"
            >
              <ArrowLeftIcon className="size-4" />
            </Button>
            <Button
              disabled={resultCount === 0}
              onClick={selectNext}
              size="icon"
              className="size-7"
              variant="ghost"
            >
              <ArrowRightIcon className="h-4 w-4" />
            </Button>
            <Separator orientation="vertical" className="mx-0.5 h-7" />
            <Button
              onClick={() => {
                setReplacing(true);
              }}
              size="icon"
              className="size-7"
              variant="ghost"
            >
              <Repeat className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => {
                setOpen(false);
              }}
              size="icon"
              className="size-7"
              variant="ghost"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className={cn("relative w-full")}>
            <X
              onClick={() => {
                setOpen(false);
              }}
              className="absolute top-3 right-3 h-4 w-4 cursor-pointer"
            />
            <div className="flex w-full items-center gap-3">
              <Button
                size="icon"
                className="size-7 rounded-full"
                variant="ghost"
                onClick={() => {
                  setReplacing(false);
                }}
              >
                <ArrowLeftIcon className="h-4 w-4" />
              </Button>
              <h2 className="text-sm font-medium">Search and replace</h2>
            </div>

            <div className="my-2 w-full">
              <div className="mb-3">
                <Label className="text-gray-11 mb-1 text-xs">Search</Label>
                <Input
                  value={searchText}
                  onChange={(event: ChangeEvent<HTMLInputElement>) => {
                    setSearchText(event.target.value);
                  }}
                  placeholder="Search..."
                />
                {resultLabel}
              </div>
              <div className="mb-2">
                <Label className="text-gray-11 mb-1 text-xs">Replace with</Label>
                <Input
                  className="w-full"
                  value={replaceText}
                  onChange={(event: ChangeEvent<HTMLInputElement>) => {
                    setReplaceText(event.target.value);
                  }}
                  placeholder="Replace..."
                />
              </div>
              <div className="mt-3 flex items-center space-x-2">
                <Checkbox
                  checked={checked}
                  onCheckedChange={(nextChecked) => {
                    setChecked(nextChecked === true);
                  }}
                  id="match_case"
                />
                <Label
                  htmlFor="match_case"
                  className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Match case
                </Label>
              </div>
            </div>

            <div className="actions mt-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  disabled={resultCount === 0}
                  onClick={selectPrevious}
                  size="icon"
                  className="h-7 w-7"
                  variant="secondary"
                >
                  <ArrowLeftIcon className="h-4 w-4" />
                </Button>
                <Button
                  disabled={resultCount === 0}
                  onClick={selectNext}
                  size="icon"
                  className="h-7 w-7"
                  variant="secondary"
                >
                  <ArrowRightIcon className="h-4 w-4" />
                </Button>
              </div>

              <div className="main-actions flex items-center gap-2">
                <Button
                  disabled={resultCount === 0}
                  size="sm"
                  className="h-7 px-3 text-xs"
                  variant="secondary"
                  onClick={replaceAll}
                >
                  Replace All
                </Button>
                <Button
                  disabled={resultCount === 0}
                  onClick={replace}
                  size="sm"
                  className="h-7 px-3 text-xs"
                >
                  Replace
                </Button>
              </div>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
