import { describe, it, expect } from "vitest";
import { mergeQuestions, mergeFlashcards, markQuestionEdited } from "../src/merge/mergeRegeneration";
import type { Question, Flashcard } from "../src/validate/kitSchema";

function makeQuestion(overrides: Partial<Question>): Question {
  return {
    id: "q1",
    requirement_ids: ["r1"],
    category: "technical",
    prompt: "prompt",
    answer_outline: "outline",
    difficulty: 2,
    origin: "generated",
    pinned: false,
    order: 0,
    rev: 1,
    ...overrides,
  };
}

function makeFlashcard(overrides: Partial<Flashcard>): Flashcard {
  return {
    id: "f1",
    front: "front",
    back: "back",
    requirement_ids: ["r1"],
    origin: "generated",
    pinned: false,
    ...overrides,
  };
}

describe("mergeQuestions", () => {
  it("removes generated, unpinned items and replaces them with fresh ones", () => {
    const existing = [makeQuestion({ id: "q1", origin: "generated", pinned: false, order: 0 })];
    const fresh = [
      {
        requirement_ids: ["r2"],
        category: "technical",
        prompt: "new prompt",
        answer_outline: "new outline",
        difficulty: 3 as const,
      },
    ];

    const merged = mergeQuestions(existing, fresh);

    expect(merged.some((q) => q.id === "q1")).toBe(false);
    expect(merged.length).toBe(1);
    expect(merged[0].prompt).toBe("new prompt");
  });

  it("keeps pinned items even though they are 'generated'", () => {
    const existing = [makeQuestion({ id: "q1", origin: "generated", pinned: true, order: 0 })];
    const merged = mergeQuestions(existing, []);

    expect(merged.some((q) => q.id === "q1")).toBe(true);
  });

  it("keeps edited items untouched", () => {
    const existing = [makeQuestion({ id: "q1", origin: "edited", pinned: false, order: 0 })];
    const merged = mergeQuestions(existing, []);

    expect(merged.some((q) => q.id === "q1")).toBe(true);
  });

  it("keeps manual items untouched", () => {
    const existing = [makeQuestion({ id: "q1", origin: "manual", pinned: false, order: 0 })];
    const merged = mergeQuestions(existing, []);

    expect(merged.some((q) => q.id === "q1")).toBe(true);
  });

  it("never reuses an id that was already used, even by a removed item", () => {
    const existing = [
      makeQuestion({ id: "q1", origin: "generated", pinned: false, order: 0 }),
      makeQuestion({ id: "q2", origin: "edited", pinned: false, order: 1 }),
    ];
    const fresh = [
      {
        requirement_ids: ["r1"],
        category: "technical",
        prompt: "p",
        answer_outline: "o",
        difficulty: 1 as const,
      },
    ];

    const merged = mergeQuestions(existing, fresh);
    const newQuestion = merged.find((q) => q.id !== "q2");

    expect(newQuestion).toBeDefined();
    expect(newQuestion!.id).not.toBe("q1");
    expect(newQuestion!.id).not.toBe("q2");
  });

  it("appends new items after the highest surviving order", () => {
    const existing = [makeQuestion({ id: "q1", origin: "edited", pinned: false, order: 5 })];
    const fresh = [
      {
        requirement_ids: ["r1"],
        category: "technical",
        prompt: "p",
        answer_outline: "o",
        difficulty: 1 as const,
      },
    ];

    const merged = mergeQuestions(existing, fresh);
    const newQuestion = merged.find((q) => q.id !== "q1")!;

    expect(newQuestion.order).toBeGreaterThan(5);
  });
});

describe("mergeFlashcards", () => {
  it("keeps pinned flashcards and replaces unpinned generated ones", () => {
    const existing = [
      makeFlashcard({ id: "f1", origin: "generated", pinned: true }),
      makeFlashcard({ id: "f2", origin: "generated", pinned: false }),
    ];
    const fresh = [{ requirement_ids: ["r1"], front: "new front", back: "new back" }];

    const merged = mergeFlashcards(existing, fresh);

    expect(merged.some((f) => f.id === "f1")).toBe(true);
    expect(merged.some((f) => f.id === "f2")).toBe(false);
    expect(merged.some((f) => f.front === "new front")).toBe(true);
  });
});

describe("markQuestionEdited", () => {
  it("flips origin to edited and bumps rev", () => {
    const question = makeQuestion({ origin: "generated", rev: 1 });
    const edited = markQuestionEdited(question);

    expect(edited.origin).toBe("edited");
    expect(edited.rev).toBe(2);
  });
});
