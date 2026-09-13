import { describe, it, expect } from "vitest";
import { validateKit } from "../src/validate/index";
import type { Kit } from "../src/validate/kitSchema";

function makeValidKit(): Kit {
  return {
    version: 1,
    source: {
      company: "Acme",
      company_url: "https://acme.com",
      role: "Software Engineer",
      location: "Remote",
      jd_chars: 500,
      researched_at: new Date().toISOString(),
      pages_used: ["https://acme.com/careers"],
    },
    company_brief: {
      summary: "Acme builds widgets.",
      what_they_do: "Widgets.",
      sources: ["https://acme.com/careers"],
    },
    role: {
      title: "Software Engineer",
      seniority: "Mid",
      responsibilities: ["Build features"],
      requirements: [
        { id: "r1", text: "3+ years React", kind: "technical", priority: "must" },
        { id: "r2", text: "Mentor juniors", kind: "behavioural", priority: "nice" },
      ],
    },
    questions: [
      {
        id: "q1",
        requirement_ids: ["r1"],
        category: "technical",
        prompt: "Explain React reconciliation",
        answer_outline: "Diffing algorithm...",
        difficulty: 2,
        origin: "generated",
        pinned: false,
        order: 0,
        rev: 1,
      },
    ],
    flashcards: [
      {
        id: "f1",
        front: "What is reconciliation?",
        back: "React's diffing process.",
        requirement_ids: ["r1"],
        origin: "generated",
        pinned: false,
      },
    ],
    schedule: {
      days_available: 1,
      days: [{ day: 1, focus: "Full sweep", question_ids: ["q1"], minutes: 15 }],
    },
    coverage: { uncovered_requirement_ids: ["r2"], passes: 1 },
  };
}

describe("validateKit", () => {
  it("accepts a well-formed kit", () => {
    const result = validateKit(makeValidKit());
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("rejects a kit with a float in minutes", () => {
    const kit = makeValidKit();
    kit.schedule.days[0].minutes = 15.5;
    const result = validateKit(kit);
    expect(result.valid).toBe(false);
  });

  it("rejects a kit with a dangling question id in the schedule", () => {
    const kit = makeValidKit();
    kit.schedule.days[0].question_ids = ["q-does-not-exist"];
    const result = validateKit(kit);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("q-does-not-exist"))).toBe(true);
  });

  it("rejects a kit where a question references an unknown requirement", () => {
    const kit = makeValidKit();
    kit.questions[0].requirement_ids = ["r-does-not-exist"];
    const result = validateKit(kit);
    expect(result.valid).toBe(false);
  });

  it("rejects a kit where a must-have requirement is not covered by any question", () => {
    const kit = makeValidKit();
    kit.questions[0].requirement_ids = ["r2"];
    const result = validateKit(kit);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("r1"))).toBe(true);
  });

  it("rejects a kit where days.length does not match days_available", () => {
    const kit = makeValidKit();
    kit.schedule.days_available = 2;
    const result = validateKit(kit);
    expect(result.valid).toBe(false);
  });
});
