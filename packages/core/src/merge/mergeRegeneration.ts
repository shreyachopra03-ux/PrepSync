import type { Question, Flashcard } from "../validate/kitSchema";

type QuestionDraft = Omit<Question, "id" | "order" | "origin" | "pinned" | "rev">;
type FlashcardDraft = Omit<Flashcard, "id" | "origin" | "pinned">;

function nextIdNumber(existingIds: string[], prefix: string): number {
  let max = 0;
  for (const id of existingIds) {
    const match = id.match(new RegExp(`^${prefix}(\\d+)$`));
    if (match) {
      max = Math.max(max, Number(match[1]));
    }
  }
  return max + 1;
}

function isProtected<T extends { origin: string; pinned: boolean }>(item: T): boolean {
  return !(item.origin === "generated" && item.pinned === false);
}

export function mergeQuestions(
  existing: Question[],
  freshlyGenerated: QuestionDraft[]
): Question[] {
  const survivors = existing.filter(isProtected).sort((a, b) => a.order - b.order);
  const highestSurvivingOrder = survivors.reduce((max, q) => Math.max(max, q.order), -1);

  let idCounter = nextIdNumber(
    existing.map((q) => q.id),
    "q"
  );

  const newQuestions: Question[] = freshlyGenerated.map((draft, index) => ({
    ...draft,
    id: `q${idCounter++}`,
    origin: "generated",
    pinned: false,
    rev: 1,
    order: highestSurvivingOrder + 1 + index,
  }));

  return [...survivors, ...newQuestions];
}

export function mergeFlashcards(
  existing: Flashcard[],
  freshlyGenerated: FlashcardDraft[]
): Flashcard[] {
  const survivors = existing.filter(isProtected);

  let idCounter = nextIdNumber(
    existing.map((f) => f.id),
    "f"
  );

  const newFlashcards: Flashcard[] = freshlyGenerated.map((draft) => ({
    ...draft,
    id: `f${idCounter++}`,
    origin: "generated",
    pinned: false,
  }));

  return [...survivors, ...newFlashcards];
}

export function markQuestionEdited(question: Question): Question {
  return { ...question, origin: "edited", rev: question.rev + 1 };
}

export function markFlashcardEdited(flashcard: Flashcard): Flashcard {
  return { ...flashcard, origin: "edited" };
}
