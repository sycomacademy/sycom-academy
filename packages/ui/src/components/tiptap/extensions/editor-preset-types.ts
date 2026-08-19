/** Passed into full editor preset for interactive question blocks (read-only mode). */
export type FullPresetCheckAnswerFn = (args: {
  questionId: string;
  selected: string[];
}) => Promise<{ isCorrect: boolean }>;
