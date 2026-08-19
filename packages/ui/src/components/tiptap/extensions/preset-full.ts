import { AudioExtension } from "@sycom-learn/ui/components/tiptap/extensions/audio";
import { AudioPlaceholder } from "@sycom-learn/ui/components/tiptap/extensions/audio-placeholder";
import { FileAttachment } from "@sycom-learn/ui/components/tiptap/extensions/file";
import { FilePlaceholder } from "@sycom-learn/ui/components/tiptap/extensions/file-placeholder";
import { ImageExtension } from "@sycom-learn/ui/components/tiptap/extensions/image";
import { ImagePlaceholder } from "@sycom-learn/ui/components/tiptap/extensions/image-placeholder";
import type { FullPresetCheckAnswerFn } from "@sycom-learn/ui/components/tiptap/extensions/editor-preset-types";
import { LessonQuestionFeedback } from "@sycom-learn/ui/components/tiptap/extensions/lesson-question-feedback";
import {
  LessonQuestion,
  type LearnQuestionLockMode,
} from "@sycom-learn/ui/components/tiptap/extensions/question";
import SearchAndReplace from "@sycom-learn/ui/components/tiptap/extensions/search-and-replace";
import { TableExtension } from "@sycom-learn/ui/components/tiptap/extensions/table";
import { VideoExtension } from "@sycom-learn/ui/components/tiptap/extensions/video";
import { VideoPlaceholder } from "@sycom-learn/ui/components/tiptap/extensions/video-placeholder";
import type { TiptapEditorUploadFn } from "@sycom-learn/ui/lib/tiptap-upload";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { Color } from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import Link from "@tiptap/extension-link";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import Typography from "@tiptap/extension-typography";
import Underline from "@tiptap/extension-underline";
import { Markdown } from "@tiptap/markdown";
import type { AnyExtension } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { common, createLowlight } from "lowlight";

const lowlight = createLowlight(common);

export type GetFullExtensionsOptions = {
  onUpload?: TiptapEditorUploadFn;
  onCheckAnswer?: FullPresetCheckAnswerFn;
  learnQuestionLock?: LearnQuestionLockMode;
};

export function getFullExtensions(options: GetFullExtensionsOptions = {}): AnyExtension[] {
  const { onUpload, onCheckAnswer, learnQuestionLock } = options;

  return [
    StarterKit.configure({
      codeBlock: false,
      link: false,
      underline: false,
      orderedList: {
        HTMLAttributes: {
          class: "list-decimal",
        },
      },
      bulletList: {
        HTMLAttributes: {
          class: "list-disc",
        },
      },
      heading: {
        levels: [1, 2, 3, 4],
      },
    }),
    CodeBlockLowlight.configure({ lowlight }),
    Placeholder.configure({
      emptyNodeClass: "is-editor-empty",
      placeholder: ({ node }) => {
        switch (node.type.name) {
          case "heading":
            return `Heading ${node.attrs.level}`;
          case "detailsSummary":
            return "Section title";
          case "codeBlock":
            return "";
          default:
            return "Write, type '/' for commands";
        }
      },
      includeChildren: false,
    }),
    TextAlign.configure({
      types: ["heading", "paragraph"],
    }),
    TextStyle,
    Subscript,
    Superscript,
    Underline,
    Link,
    Color,
    Highlight.configure({
      multicolor: true,
    }),
    ImageExtension,
    ImagePlaceholder.configure(onUpload ? { onUpload } : {}),
    VideoExtension,
    VideoPlaceholder.configure(onUpload ? { onUpload } : {}),
    AudioExtension,
    AudioPlaceholder.configure(onUpload ? { onUpload } : {}),
    FileAttachment,
    FilePlaceholder.configure(onUpload ? { onUpload } : {}),
    TableExtension,
    SearchAndReplace,
    Typography,
    LessonQuestionFeedback,
    LessonQuestion.configure({
      ...(onCheckAnswer ? { onCheckAnswer } : {}),
      ...(learnQuestionLock ? { learnQuestionLock } : {}),
    }),
    Markdown.configure({
      markedOptions: { gfm: true },
    }),
  ];
}
