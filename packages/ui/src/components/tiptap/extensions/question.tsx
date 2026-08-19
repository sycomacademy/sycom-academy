import { useEditorEditable } from "@sycom-learn/ui/components/tiptap/use-editor-editable";
import { Button } from "@sycom-learn/ui/components/button";
import { Checkbox } from "@sycom-learn/ui/components/checkbox";
import { Input } from "@sycom-learn/ui/components/input";
import { Field, FieldLabel } from "@sycom-learn/ui/components/field";
import {
  useQuestionTracking,
  type QuestionStatus,
} from "@sycom-learn/ui/components/tiptap/extensions/question-tracking";
import { cn } from "@sycom-learn/ui/lib/utils";
import {
  type CommandProps,
  Node,
  type NodeViewProps,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  mergeAttributes,
  useEditorState,
} from "@tiptap/react";
import { NodeSelection, Plugin, PluginKey } from "@tiptap/pm/state";
import { hasQuestionFence, parseQuestionPaste } from "./question-paste";
import { CheckCircle2, CircleHelp, Plus, Trash2, XCircle } from "lucide-react";
import { useEffect, useState } from "react";

import {
  lessonQuestionFeedbackKey,
  type LessonQuestionAttempt,
} from "@sycom-learn/ui/components/tiptap/extensions/lesson-question-feedback";
import type { FullPresetCheckAnswerFn } from "./editor-preset-types";

export type QuestionOptionAttr = {
  id: string;
  text: string;
  isCorrect?: boolean;
};

export type LessonQuestionAttrs = {
  questionId: string;
  prompt: string;
  type: "single" | "multi";
  options: QuestionOptionAttr[];
  explanation?: string;
};

export type LearnQuestionLockMode = "onCorrect" | "onAttempt";

export interface LessonQuestionOptions {
  onCheckAnswer?: FullPresetCheckAnswerFn;
  /** Learner UX: when choices + Check stay disabled after a check. Default matches articles (`onCorrect`). */
  learnQuestionLock?: LearnQuestionLockMode;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    lessonQuestion: {
      insertLessonQuestion: () => ReturnType;
    };
  }
}

function newOption(text: string, isCorrect = false): QuestionOptionAttr {
  return { id: crypto.randomUUID(), text, isCorrect };
}

export const LessonQuestion = Node.create<LessonQuestionOptions>({
  name: "question",
  group: "block",
  atom: true,
  draggable: true,

  addOptions() {
    return {
      onCheckAnswer: undefined,
      learnQuestionLock: "onCorrect" satisfies LearnQuestionLockMode,
    };
  },

  addAttributes() {
    return {
      questionId: {
        default: "",
      },
      prompt: {
        default: "",
      },
      type: {
        default: "single",
      },
      options: {
        default: [],
      },
      explanation: {
        default: "",
      },
    };
  },

  parseHTML() {
    return [{ tag: `div[data-type="${this.name}"]` }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-type": this.name })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(QuestionNodeView, {
      className: "question-node-view-root",
    });
  },

  addProseMirrorPlugins() {
    const editor = this.editor;
    return [
      new Plugin({
        key: new PluginKey("lessonQuestionPaste"),
        props: {
          handlePaste: (_view, event) => {
            if (!editor.isEditable) return false;
            const text = event.clipboardData?.getData("text/plain");
            if (!text || !hasQuestionFence(text)) return false;

            const parts = parseQuestionPaste(text);
            if (!parts.some((p) => p.kind === "question")) return false;

            // Insert each part as its own transaction at the current selection
            // end. A single chain of `insertContent` calls would leave each
            // inserted atom node-selected, so the next insert replaces it —
            // collapsing every question down to the last. Re-reading
            // `selection.to` after each command and using `insertContentAt`
            // (position-based, never replaces a selection) appends cleanly.
            editor.commands.focus();
            editor.commands.deleteSelection();
            for (const part of parts) {
              const at = editor.state.selection.to;
              if (part.kind === "question") {
                editor.commands.insertContentAt(at, { type: "question", attrs: part.attrs });
              } else {
                editor.commands.insertContentAt(at, part.text, { contentType: "markdown" });
              }
            }
            // The final insert can leave the last question node-selected, which
            // blocks typing into its prompt input. Collapse to a text cursor.
            const { selection } = editor.state;
            if (selection instanceof NodeSelection) {
              editor.commands.setTextSelection(selection.to);
            }
            return true;
          },
        },
      }),
    ];
  },

  addCommands() {
    return {
      insertLessonQuestion:
        () =>
        ({ commands }: CommandProps) => {
          return commands.insertContent({
            type: this.name,
            attrs: {
              questionId: crypto.randomUUID(),
              prompt: "",
              type: "single",
              options: [newOption("Option 1", true), newOption("Option 2", false)],
              explanation: "",
            },
          });
        },
    };
  },
});

function statusBadge(
  status: QuestionStatus | undefined,
  variant: "teacher" | "learn",
  attemptLocked: boolean,
) {
  if (status === "correct") {
    return (
      <span className="inline-flex items-center gap-1 text-sm font-medium text-emerald-600">
        <CheckCircle2 className="size-4" /> Correct
      </span>
    );
  }
  if (status === "incorrect") {
    const label = variant === "teacher" ? "Incorrect" : attemptLocked ? "Incorrect" : "Try again";
    return (
      <span className="inline-flex items-center gap-1 text-sm font-medium text-destructive">
        <XCircle className="size-4" /> {label}
      </span>
    );
  }
  return null;
}

function QuestionNodeView(props: NodeViewProps) {
  const { node, editor, updateAttributes, selected, extension } = props;
  const canEdit = useEditorEditable(editor);
  const tracking = useQuestionTracking();
  const onCheckAnswer = extension.options.onCheckAnswer as FullPresetCheckAnswerFn | undefined;
  const lockMode = extension.options.learnQuestionLock ?? "onCorrect";

  const questionId = node.attrs.questionId as string;
  const prompt = node.attrs.prompt as string;
  const type = node.attrs.type as "single" | "multi";
  const options = (node.attrs.options ?? []) as QuestionOptionAttr[];
  const explanation = (node.attrs.explanation ?? "") as string;
  const fieldIdPrefix = `question-${questionId}`;

  const [singlePick, setSinglePick] = useState<string | null>(null);
  const [multiPick, setMultiPick] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (canEdit || !tracking || !questionId) return;
    tracking.register(questionId);
    return () => tracking.unregister(questionId);
  }, [canEdit, tracking, questionId]);

  const handleSetOptionText = (id: string, text: string) => {
    updateAttributes({
      options: options.map((o) => (o.id === id ? { ...o, text } : o)),
    });
  };

  const handleToggleCorrect = (id: string) => {
    if (type === "single") {
      updateAttributes({
        options: options.map((o) => ({ ...o, isCorrect: o.id === id })),
      });
    } else {
      updateAttributes({
        options: options.map((o) => (o.id === id ? { ...o, isCorrect: !o.isCorrect } : o)),
      });
    }
  };

  const addOption = () => {
    updateAttributes({
      options: [...options, newOption(`Option ${options.length + 1}`, false)],
    });
  };

  const removeOption = (id: string) => {
    if (options.length <= 2) return;
    updateAttributes({
      options: options.filter((o) => o.id !== id),
    });
  };

  const handleSubmit = async () => {
    if (!onCheckAnswer) return;
    const selectedIds =
      type === "single"
        ? singlePick
          ? [singlePick]
          : []
        : Object.entries(multiPick)
            .filter(([, v]) => v)
            .map(([k]) => k);

    if (selectedIds.length === 0) return;

    const normalizedSelected = type === "single" ? selectedIds : [...selectedIds].sort();

    setSubmitting(true);
    try {
      const { isCorrect } = await onCheckAnswer({
        questionId,
        selected: normalizedSelected,
      });
      editor
        .chain()
        .setLessonQuestionResult({
          questionId,
          isCorrect,
          selected: normalizedSelected,
        })
        .run();
      tracking?.setResult(questionId, isCorrect);
    } finally {
      setSubmitting(false);
    }
  };

  const attempt = useEditorState({
    editor,
    selector: ({ editor: ed }) =>
      lessonQuestionFeedbackKey.getState(ed.state)?.[questionId] as
        | LessonQuestionAttempt
        | undefined,
  });

  const viewStatus = attempt?.status;
  const selectionLocked =
    lockMode === "onAttempt" ? Boolean(attempt) : attempt?.status === "correct";

  const optionSingleChecked = (optId: string) =>
    selectionLocked && attempt ? attempt.selected[0] === optId : singlePick === optId;

  const optionMultiChecked = (optId: string) =>
    selectionLocked && attempt ? attempt.selected.includes(optId) : !!multiPick[optId];

  if (canEdit) {
    return (
      <NodeViewWrapper
        className={cn(
          "my-4 rounded-lg border bg-card p-4 shadow-xs/5",
          selected && "ring-2 ring-primary ring-offset-2 ring-offset-background",
        )}
        data-drag-handle=""
      >
        <div className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <CircleHelp className="size-4" />
          Question block
        </div>
        <div className="space-y-3">
          <Field className="w-full gap-1">
            <FieldLabel className="text-xs" htmlFor={`${fieldIdPrefix}-prompt`}>
              Prompt
            </FieldLabel>
            <Input
              id={`${fieldIdPrefix}-prompt`}
              onChange={(e) => updateAttributes({ prompt: e.target.value })}
              placeholder="Ask something…"
              value={prompt}
            />
          </Field>
          <Field className="w-full gap-1">
            <FieldLabel className="text-xs" htmlFor={`${fieldIdPrefix}-type`}>
              Type
            </FieldLabel>
            <select
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs/5"
              id={`${fieldIdPrefix}-type`}
              onChange={(e) => {
                const next = e.target.value === "multi" ? "multi" : "single";
                updateAttributes({
                  type: next,
                  options:
                    next === "single"
                      ? options.map((o, i) => ({ ...o, isCorrect: i === 0 }))
                      : options.map((o) => ({ ...o, isCorrect: !!o.isCorrect })),
                });
              }}
              value={type}
            >
              <option value="single">One correct answer</option>
              <option value="multi">Multiple correct answers</option>
            </select>
          </Field>
          <Field className="w-full gap-1">
            <FieldLabel className="text-xs">Options</FieldLabel>
            <div className="w-full space-y-2">
              {options.map((opt) => (
                <div key={opt.id} className="flex flex-wrap items-center gap-2">
                  <Input
                    id={`${fieldIdPrefix}-option-${opt.id}`}
                    onChange={(e) => handleSetOptionText(opt.id, e.target.value)}
                    className="min-w-48 flex-1"
                    value={opt.text}
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant={opt.isCorrect ? "default" : "outline"}
                    onClick={() => handleToggleCorrect(opt.id)}
                  >
                    {type === "single" ? "Correct" : "Correct?"}
                  </Button>
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    disabled={options.length <= 2}
                    aria-label="Remove option"
                    onClick={() => removeOption(opt.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
              <Button type="button" size="sm" variant="outline" onClick={addOption}>
                <Plus className="mr-1 size-4" />
                Add option
              </Button>
            </div>
          </Field>
          <Field className="w-full gap-1">
            <FieldLabel className="text-xs" htmlFor={`${fieldIdPrefix}-explanation`}>
              Explanation (shown after submit)
            </FieldLabel>
            <Input
              id={`${fieldIdPrefix}-explanation`}
              onChange={(e) => updateAttributes({ explanation: e.target.value })}
              placeholder="Optional"
              value={explanation}
            />
          </Field>
        </div>
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper
      className={cn(
        "my-4 rounded-lg border bg-muted/20 p-4",
        selected && "ring-2 ring-primary ring-offset-2 ring-offset-background",
      )}
    >
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          <CircleHelp className="size-4 text-muted-foreground" />
          Question
        </div>
        {statusBadge(viewStatus, "learn", selectionLocked)}
      </div>
      <p className="mb-3 text-base font-medium">{prompt || "Question"}</p>
      <div className="space-y-2">
        {type === "single" ? (
          <div className="flex flex-col gap-2">
            {options.map((opt) => (
              <label
                htmlFor={`${fieldIdPrefix}-answer-${opt.id}`}
                key={opt.id}
                className={cn(
                  "flex items-center gap-2 rounded-md border border-border/80 bg-background px-3 py-2 text-sm",
                  selectionLocked ? "cursor-not-allowed opacity-90" : "cursor-pointer",
                )}
              >
                <input
                  id={`${fieldIdPrefix}-answer-${opt.id}`}
                  type="radio"
                  name={`q-${questionId}`}
                  checked={optionSingleChecked(opt.id)}
                  disabled={selectionLocked}
                  onChange={() => setSinglePick(opt.id)}
                  className="size-4 accent-primary disabled:cursor-not-allowed"
                />
                <span>{opt.text}</span>
              </label>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {options.map((opt) => (
              <label
                htmlFor={`${fieldIdPrefix}-answer-${opt.id}`}
                key={opt.id}
                className={cn(
                  "flex items-center gap-2 rounded-md border border-border/80 bg-background px-3 py-2 text-sm",
                  selectionLocked ? "cursor-not-allowed opacity-90" : "cursor-pointer",
                )}
              >
                <Checkbox
                  id={`${fieldIdPrefix}-answer-${opt.id}`}
                  checked={optionMultiChecked(opt.id)}
                  disabled={selectionLocked}
                  onCheckedChange={(checked) =>
                    setMultiPick((prev) => ({ ...prev, [opt.id]: checked === true }))
                  }
                />
                <span>{opt.text}</span>
              </label>
            ))}
          </div>
        )}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          disabled={
            selectionLocked ||
            submitting ||
            !onCheckAnswer ||
            (type === "single" ? !singlePick : !Object.values(multiPick).some(Boolean))
          }
          loading={submitting}
          onClick={() => void handleSubmit()}
        >
          Check answer
        </Button>
        {!onCheckAnswer ? (
          <span className="text-xs text-muted-foreground">
            Answer checking is not configured for this editor.
          </span>
        ) : null}
      </div>
      {attempt && explanation.trim() ? (
        <p className="mt-3 rounded-md border border-border/70 bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
          {explanation.trim()}
        </p>
      ) : null}
    </NodeViewWrapper>
  );
}
