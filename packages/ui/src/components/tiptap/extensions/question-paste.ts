import type { LessonQuestionAttrs, QuestionOptionAttr } from "./question";

/**
 * Parses pasted plain text into ordered parts so an external author (e.g. a
 * Claude tab) can write multiple-choice questions in a readable fence and have
 * them drop into the editor as real question nodes.
 *
 * Convention (one block per question):
 *
 *   ::: question
 *   What does TCP guarantee?
 *   - [x] Ordered, reliable delivery
 *   - [ ] Encryption
 *   - [ ] Lower latency than UDP
 *   > Because TCP sequences and retransmits segments.
 *   :::
 *
 * `[x]` marks a correct option, `[ ]` an incorrect one. A line starting with
 * `>` is the (optional) explanation shown after submit. Everything before the
 * first option is the prompt. `single` vs `multi` is inferred from how many
 * options are correct.
 */

const FENCE_OPEN = /^:::\s*question\s*$/i;
const FENCE_CLOSE = /^:::\s*$/;
const OPTION_RE = /^[-*]\s*\[\s*([xX ])\s*\]\s+(.+?)\s*$/;
const EXPLANATION_RE = /^>\s?(.*)$/;

/** Cap matches the generated-question schema (`generatedLessonQuestionSchema`). */
const MAX_OPTIONS = 8;

export type QuestionPastePart =
  | { kind: "prose"; text: string }
  | { kind: "question"; attrs: LessonQuestionAttrs };

/** Cheap pre-check so we only intercept pastes that actually contain a question fence. */
export function hasQuestionFence(text: string): boolean {
  return text.split(/\r?\n/).some((line) => FENCE_OPEN.test(line.trim()));
}

function buildQuestionAttrs(block: string[]): LessonQuestionAttrs | null {
  const promptLines: string[] = [];
  const options: QuestionOptionAttr[] = [];
  const explanationLines: string[] = [];
  let seenOption = false;

  for (const raw of block) {
    const line = raw.trim();
    if (!line) continue;

    const opt = OPTION_RE.exec(line);
    if (opt) {
      seenOption = true;
      if (options.length < MAX_OPTIONS) {
        options.push({
          id: crypto.randomUUID(),
          text: (opt[2] ?? "").trim(),
          isCorrect: (opt[1] ?? "").toLowerCase() === "x",
        });
      }
      continue;
    }

    const exp = EXPLANATION_RE.exec(line);
    if (exp) {
      explanationLines.push((exp[1] ?? "").trim());
      continue;
    }

    // Prose before the first option is the prompt; stray lines after options are ignored.
    if (!seenOption) promptLines.push(line);
  }

  const prompt = promptLines.join(" ").trim();
  const correctCount = options.filter((o) => o.isCorrect).length;
  // Mirror the editor's hard rules: a real question needs a prompt, >= 2 options,
  // and at least one correct answer. Anything short of that isn't a question.
  if (!prompt || options.length < 2 || correctCount < 1) return null;

  return {
    questionId: crypto.randomUUID(),
    prompt,
    type: correctCount > 1 ? "multi" : "single",
    options,
    explanation: explanationLines.join(" ").trim() || undefined,
  };
}

export function parseQuestionPaste(text: string): QuestionPastePart[] {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const parts: QuestionPastePart[] = [];
  let prose: string[] = [];

  const flushProse = () => {
    const joined = prose.join("\n").trim();
    if (joined) parts.push({ kind: "prose", text: joined });
    prose = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? "";
    if (!FENCE_OPEN.test(line.trim())) {
      prose.push(line);
      continue;
    }

    // Collect the block body up to the closing fence.
    const block: string[] = [];
    let j = i + 1;
    let closed = false;
    for (; j < lines.length; j++) {
      const blockLine = lines[j] ?? "";
      if (FENCE_CLOSE.test(blockLine.trim())) {
        closed = true;
        break;
      }
      block.push(blockLine);
    }

    const attrs = closed ? buildQuestionAttrs(block) : null;
    if (attrs) {
      flushProse();
      parts.push({ kind: "question", attrs });
      i = j; // resume after the closing fence
    } else {
      // Not a valid question — keep the inner lines as prose, drop the fence markers.
      prose.push(...block);
      i = closed ? j : lines.length;
    }
  }

  flushProse();
  return parts;
}
