import type { Editor } from "@tiptap/core";
import { useEffect } from "react";

export type LessonAnswerEntry = {
  selected: string[];
  isCorrect: boolean;
};

/**
 * Replays previously-recorded learner answers into the editor's question feedback plugin
 * after mount, so the lesson player visually reflects the learner's prior attempts.
 */
export function useHydrateLessonAnswers(
  editor: Editor | null,
  answers: Record<string, LessonAnswerEntry> | undefined,
) {
  useEffect(() => {
    if (!editor || !answers) return;
    for (const [questionId, attempt] of Object.entries(answers)) {
      editor.commands.setLessonQuestionResult({
        questionId,
        selected: attempt.selected,
        isCorrect: attempt.isCorrect,
      });
    }
  }, [editor, answers]);
}
