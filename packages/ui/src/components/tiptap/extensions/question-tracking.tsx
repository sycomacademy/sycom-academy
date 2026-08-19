import type { Editor } from "@tiptap/core";
import { getLessonQuestionGateSnapshot } from "@sycom-learn/ui/components/tiptap/extensions/lesson-question-feedback";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { QuestionStatus } from "@sycom-learn/ui/components/tiptap/extensions/question-status";

export type { QuestionStatus };

type QuestionTrackingContextValue = {
  register: (id: string) => void;
  unregister: (id: string) => void;
  setResult: (id: string, ok: boolean) => void;
  statuses: Record<string, QuestionStatus>;
};

const QuestionTrackingContext = createContext<QuestionTrackingContextValue | null>(null);

export function QuestionTrackingProvider({ children }: { children: ReactNode }) {
  const [statuses, setStatuses] = useState<Record<string, QuestionStatus>>({});

  const register = useCallback((id: string) => {
    setStatuses((s) => (id in s ? s : { ...s, [id]: "unanswered" }));
  }, []);

  const unregister = useCallback((id: string) => {
    setStatuses((s) => {
      if (!(id in s)) return s;
      const next = { ...s };
      delete next[id];
      return next;
    });
  }, []);

  const setResult = useCallback((id: string, ok: boolean) => {
    setStatuses((s) => ({ ...s, [id]: ok ? "correct" : "incorrect" }));
  }, []);

  const value = useMemo(
    () => ({ register, unregister, setResult, statuses }),
    [register, unregister, setResult, statuses],
  );

  return (
    <QuestionTrackingContext.Provider value={value}>{children}</QuestionTrackingContext.Provider>
  );
}

export function useQuestionTracking() {
  return useContext(QuestionTrackingContext);
}

export function useQuestionGate(editor?: Editor | null) {
  const ctx = useQuestionTracking();
  const gateFromEditor = editor !== undefined;
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!gateFromEditor || !editor) return;
    const bump = () => setTick((n) => n + 1);
    editor.on("transaction", bump);
    return () => {
      editor.off("transaction", bump);
    };
  }, [editor, gateFromEditor]);

  void tick;

  if (gateFromEditor) {
    if (!editor) {
      return {
        allCorrect: true,
        allAttempted: true,
        statuses: {} as Record<string, QuestionStatus>,
        questionCount: 0,
      };
    }
    return getLessonQuestionGateSnapshot(editor);
  }

  if (!ctx) {
    return {
      allCorrect: true,
      allAttempted: true,
      statuses: {} as Record<string, QuestionStatus>,
      questionCount: 0,
    };
  }

  const ids = Object.keys(ctx.statuses);
  const questionCount = ids.length;
  return {
    allCorrect: questionCount === 0 || ids.every((id) => ctx.statuses[id] === "correct"),
    allAttempted: questionCount === 0 || ids.every((id) => ctx.statuses[id] !== "unanswered"),
    statuses: ctx.statuses,
    questionCount,
  };
}
