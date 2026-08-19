import "./tiptap.css";

import { getLightweightExtensions } from "@sycom-learn/ui/components/tiptap/extensions/preset-lightweight";
import {
  getFullExtensions,
  type GetFullExtensionsOptions,
} from "@sycom-learn/ui/components/tiptap/extensions/preset-full";
import { TipTapFloatingMenu } from "@sycom-learn/ui/components/tiptap/extensions/floating-menu";
import { FloatingToolbar } from "@sycom-learn/ui/components/tiptap/extensions/floating-toolbar";
import { TableBubbleMenu } from "@sycom-learn/ui/components/tiptap/extensions/table-bubble-menu";
import type { TiptapEditorUploadFn } from "@sycom-learn/ui/lib/tiptap-upload";
import { cn } from "@sycom-learn/ui/lib/utils";
import { content as demoHtmlContent } from "@sycom-learn/ui/lib/content";
import type { FullPresetCheckAnswerFn } from "@sycom-learn/ui/components/tiptap/extensions/editor-preset-types";
import type { Content, Editor, JSONContent } from "@tiptap/core";
import { EditorContent, useEditor } from "@tiptap/react";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  SignedMediaUrlContext,
  type ResolveMediaUrl,
} from "@sycom-learn/ui/components/tiptap/signed-media-url-context";

import { EditorToolbar } from "./toolbars/editor-toolbar";
import { LightweightEditorToolbar } from "./toolbars/lightweight-toolbar";

export type RichTextEditorProps = {
  mode: "lightweight" | "full";
  /** `learn`: tight read-only layout for the course player (overrides heavy ProseMirror padding). */
  variant?: "default" | "embedded" | "learn";
  /** Initial / controlled document (HTML string or JSON). */
  content?: Content | null;
  editable?: boolean;
  onChange?: (json: JSONContent) => void;
  onUpload?: TiptapEditorUploadFn;
  onCheckAnswer?: FullPresetCheckAnswerFn;
  /** Course player: article vs quiz/exam question locking (see `LessonQuestion` extension). */
  learnQuestionLock?: GetFullExtensionsOptions["learnQuestionLock"];
  className?: string;
  contentClassName?: string;
  /** Merged onto the `EditorContent` wrapper (default includes `min-h-[600px]`). */
  editorContentClassName?: string;
  /** If true (default), full mode mounts slash menu + table bubble + floating toolbar. */
  showAdvancedChrome?: boolean;
  /** Called once when the TipTap editor instance is ready (stable for the lifetime of the component). */
  onEditorReady?: (editor: Editor) => void;
  /** When set, lesson media nodes resolve Cloudinary public ids through signed URLs. */
  resolveMediaUrl?: ResolveMediaUrl;
};

export function RichTextEditor({
  mode,
  variant = "default",
  content = null,
  editable = true,
  onChange,
  onUpload,
  onCheckAnswer,
  learnQuestionLock,
  className,
  contentClassName,
  editorContentClassName,
  showAdvancedChrome = true,
  onEditorReady,
  resolveMediaUrl,
}: RichTextEditorProps) {
  const [viewOnly, setViewOnly] = useState(false);
  const editorEditable = editable && !viewOnly;
  const isLightweight = mode === "lightweight";
  const isEmbedded = variant === "embedded";
  const isLearn = variant === "learn";
  const isCompactChrome = isEmbedded || isLearn;

  useEffect(() => {
    if (!editable) setViewOnly(false);
  }, [editable]);

  const onUploadRef = useRef(onUpload);
  const onCheckAnswerRef = useRef(onCheckAnswer);
  onUploadRef.current = onUpload;
  onCheckAnswerRef.current = onCheckAnswer;

  const hasUploadCallback = Boolean(onUpload);
  const hasCheckAnswerCallback = Boolean(onCheckAnswer);

  const extensions = useMemo(() => {
    if (mode === "lightweight") {
      return getLightweightExtensions();
    }
    const opts: GetFullExtensionsOptions = {};
    if (hasUploadCallback) {
      opts.onUpload = async (file) => {
        const fn = onUploadRef.current;
        if (!fn) {
          throw new Error("RichTextEditor: upload handler was removed unexpectedly");
        }
        return fn(file);
      };
    }
    if (hasCheckAnswerCallback) {
      opts.onCheckAnswer = async (args) => {
        const fn = onCheckAnswerRef.current;
        if (!fn) {
          return { isCorrect: false };
        }
        return fn(args);
      };
    }
    if (learnQuestionLock) {
      opts.learnQuestionLock = learnQuestionLock;
    }
    return getFullExtensions(opts);
  }, [mode, hasUploadCallback, hasCheckAnswerCallback, learnQuestionLock]);

  const editor = useEditor({
    immediatelyRender: false,
    extensions,
    content: content === null ? "" : (content ?? undefined),
    editable: editorEditable,
    editorProps: {
      attributes: {
        class: cn("max-w-full focus:outline-none", contentClassName),
      },
    },
    onUpdate: ({ editor: ed }) => {
      onChange?.(ed.getJSON());
    },
  });

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(editorEditable);
  }, [editor, editorEditable]);

  useEffect(() => {
    if (!editor || content === undefined) return;
    if (typeof content === "string") {
      if (editor.getHTML() === content) return;
      editor.commands.setContent(content, { emitUpdate: false });
      return;
    }
    const current = editor.getJSON();
    if (JSON.stringify(current) === JSON.stringify(content)) return;
    editor.commands.setContent(content ?? "", { emitUpdate: false });
  }, [editor, content]);

  useEffect(() => {
    if (editor) {
      onEditorReady?.(editor);
    }
  }, [editor, onEditorReady]);

  if (!editor) return null;

  const editorBody = (
    <div
      data-editor-mode={mode}
      data-editor-variant={variant}
      className={cn(
        isLightweight
          ? "relative w-full overflow-hidden border bg-card"
          : isCompactChrome
            ? "relative w-full overflow-hidden border bg-card"
            : "relative max-h-[calc(100dvh-6rem)] w-full overflow-hidden overflow-y-scroll border bg-card pb-[60px] sm:pb-0",
        className,
      )}
    >
      {editable && (
        <>
          {mode === "lightweight" ? (
            <LightweightEditorToolbar editor={editor} />
          ) : (
            <EditorToolbar
              editor={editor}
              viewOnlyToggle={{ viewOnly, onViewOnlyChange: setViewOnly }}
            />
          )}
        </>
      )}
      {mode === "full" && editable && showAdvancedChrome ? (
        <>
          <FloatingToolbar editor={editor} />
          <TableBubbleMenu editor={editor} />
          <TipTapFloatingMenu editor={editor} />
        </>
      ) : null}
      <EditorContent
        editor={editor}
        className={cn(
          isLightweight
            ? "min-h-[140px] w-full min-w-full cursor-text"
            : isLearn
              ? "min-h-0 w-full min-w-full cursor-text"
              : isEmbedded
                ? "min-h-[210px] w-full min-w-full cursor-text"
                : "min-h-[600px] w-full min-w-full cursor-text sm:p-6",
          editorContentClassName,
        )}
      />
    </div>
  );

  if (!resolveMediaUrl) return editorBody;

  return <SignedMediaUrlContext value={resolveMediaUrl}>{editorBody}</SignedMediaUrlContext>;
}

export function RichTextEditorDemo({ className }: { className?: string }) {
  return <RichTextEditor mode="full" content={demoHtmlContent} className={className} />;
}

export type { FullPresetCheckAnswerFn } from "@sycom-learn/ui/components/tiptap/extensions/editor-preset-types";
export { collectLessonQuestionAnswersForSubmit } from "@sycom-learn/ui/components/tiptap/extensions/lesson-question-feedback";
export {
  QuestionTrackingProvider,
  useQuestionGate,
} from "@sycom-learn/ui/components/tiptap/extensions/question-tracking";
export { useHydrateLessonAnswers } from "@sycom-learn/ui/components/tiptap/extensions/use-hydrate-lesson-answers";
