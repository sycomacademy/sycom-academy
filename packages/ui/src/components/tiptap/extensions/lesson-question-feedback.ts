import { Extension, type Editor } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import type { EditorState } from "@tiptap/pm/state";

import type { QuestionStatus } from "@sycom-learn/ui/components/tiptap/extensions/question-status";

/** Per-question learner attempt after "Check answer" (selection + outcome). */
export type LessonQuestionAttempt = {
  status: "correct" | "incorrect";
  selected: string[];
};

export type LessonQuestionFeedbackState = Record<string, LessonQuestionAttempt>;

export const lessonQuestionFeedbackKey = new PluginKey<LessonQuestionFeedbackState>(
  "lessonQuestionFeedback",
);

export type LessonQuestionResultMeta = {
  questionId: string;
  isCorrect: boolean;
  selected: string[];
};

export function collectQuestionIds(state: EditorState): string[] {
  const ids: string[] = [];
  state.doc.descendants((node) => {
    if (node.type.name === "question") {
      const id = node.attrs.questionId as string | undefined;
      if (id) ids.push(id);
    }
  });
  return ids;
}

export function getLessonQuestionAttemptsMap(state: EditorState): LessonQuestionFeedbackState {
  return lessonQuestionFeedbackKey.getState(state) ?? {};
}

export function feedbackAttemptsToStatuses(
  attempts: LessonQuestionFeedbackState,
  questionIds: string[],
): Record<string, QuestionStatus> {
  const statuses: Record<string, QuestionStatus> = {};
  for (const id of questionIds) {
    const a = attempts[id];
    statuses[id] = a ? a.status : "unanswered";
  }
  return statuses;
}

export function getLessonQuestionGateSnapshot(editor: Editor): {
  statuses: Record<string, QuestionStatus>;
  questionCount: number;
  allCorrect: boolean;
  allAttempted: boolean;
} {
  const attempts = getLessonQuestionAttemptsMap(editor.state);
  const ids = collectQuestionIds(editor.state);
  const statuses = feedbackAttemptsToStatuses(attempts, ids);
  const questionCount = ids.length;
  const allCorrect = questionCount === 0 || ids.every((id) => attempts[id]?.status === "correct");
  const allAttempted =
    questionCount === 0 ||
    ids.every((id) => {
      const a = attempts[id];
      return a?.status === "correct" || a?.status === "incorrect";
    });
  return { statuses, questionCount, allCorrect, allAttempted };
}

/** Build payload for scored lesson submission (quiz / exam). */
export function collectLessonQuestionAnswersForSubmit(state: EditorState): Array<{
  questionId: string;
  selected: string[];
}> {
  const attempts = getLessonQuestionAttemptsMap(state);
  return collectQuestionIds(state).map((questionId) => ({
    questionId,
    selected: attempts[questionId]?.selected ?? [],
  }));
}

export const LessonQuestionFeedback = Extension.create({
  name: "lessonQuestionFeedback",

  addCommands() {
    return {
      setLessonQuestionResult:
        ({ questionId, isCorrect, selected }: LessonQuestionResultMeta) =>
        ({ tr, dispatch }) => {
          if (dispatch) {
            tr.setMeta(lessonQuestionFeedbackKey, { questionId, isCorrect, selected });
            dispatch(tr);
          }
          return true;
        },
    };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin<LessonQuestionFeedbackState>({
        key: lessonQuestionFeedbackKey,
        state: {
          init: () => ({}),
          apply(tr, value) {
            const meta = tr.getMeta(lessonQuestionFeedbackKey) as
              | LessonQuestionResultMeta
              | undefined;
            if (
              meta?.questionId != null &&
              typeof meta.isCorrect === "boolean" &&
              Array.isArray(meta.selected)
            ) {
              return {
                ...value,
                [meta.questionId]: {
                  status: meta.isCorrect ? "correct" : "incorrect",
                  selected: meta.selected,
                },
              };
            }
            return value;
          },
        },
      }),
    ];
  },
});

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    lessonQuestionFeedback: {
      setLessonQuestionResult: (args: LessonQuestionResultMeta) => ReturnType;
    };
  }
}
