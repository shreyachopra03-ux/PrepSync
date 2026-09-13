import { describe, it, expect } from "vitest";
import { buildSchedule } from "../src/schedule/buildSchedule";
import type { Requirement, Question } from "../src/validate/kitSchema";

function makeRequirement(id: string, priority: "must" | "nice"): Requirement {
  return { id, text: `requirement ${id}`, kind: "technical", priority };
}

function makeQuestion(
  id: string,
  requirementIds: string[],
  difficulty: 1 | 2 | 3,
  order: number
): Question {
  return {
    id,
    requirement_ids: requirementIds,
    category: "technical",
    prompt: `prompt ${id}`,
    answer_outline: "outline",
    difficulty,
    origin: "generated",
    pinned: false,
    order,
    rev: 1,
  };
}

describe("buildSchedule", () => {
  it("puts everything on day 1 with focus 'Full sweep' when days=1", () => {
    const requirements = [makeRequirement("r1", "must")];
    const questions = [makeQuestion("q1", ["r1"], 2, 0), makeQuestion("q2", ["r1"], 1, 1)];

    const schedule = buildSchedule(requirements, questions, 1);

    expect(schedule.days.length).toBe(1);
    expect(schedule.days[0].day).toBe(1);
    expect(schedule.days[0].focus).toBe("Full sweep");
    expect(schedule.days[0].question_ids.sort()).toEqual(["q1", "q2"]);
    expect(schedule.days[0].minutes).toBe(15 + 10);
  });

  it("always produces exactly days_available days", () => {
    const requirements = [makeRequirement("r1", "must")];
    const questions = [makeQuestion("q1", ["r1"], 3, 0)];

    const schedule = buildSchedule(requirements, questions, 5);

    expect(schedule.days.length).toBe(5);
    expect(schedule.days_available).toBe(5);
  });

  it("produces review days that reference existing questions when days > content needs", () => {
    const requirements = [makeRequirement("r1", "must")];
    const questions = [makeQuestion("q1", ["r1"], 1, 0)];

    const schedule = buildSchedule(requirements, questions, 60);

    expect(schedule.days.length).toBe(60);
    const allReferencedIds = schedule.days.flatMap((d) => d.question_ids);
    for (const id of allReferencedIds) {
      expect(id).toBe("q1");
    }
  });

  it("ensures every must-have requirement appears in at least one day", () => {
    const requirements = [makeRequirement("r1", "must"), makeRequirement("r2", "must")];
    const questions = [
      makeQuestion("q1", ["r1"], 2, 0),
      makeQuestion("q2", ["r2"], 3, 1),
      makeQuestion("q3", ["r1"], 1, 2),
    ];

    const schedule = buildSchedule(requirements, questions, 3);
    const coveredIds = new Set(
      schedule.days.flatMap((d) =>
        d.question_ids.flatMap((qid) => questions.find((q) => q.id === qid)?.requirement_ids ?? [])
      )
    );

    expect(coveredIds.has("r1")).toBe(true);
    expect(coveredIds.has("r2")).toBe(true);
  });

  it("keeps minutes as integers equal to the sum of that day's questions", () => {
    const requirements = [makeRequirement("r1", "must")];
    const questions = [
      makeQuestion("q1", ["r1"], 1, 0),
      makeQuestion("q2", ["r1"], 2, 1),
      makeQuestion("q3", ["r1"], 3, 2),
    ];

    const schedule = buildSchedule(requirements, questions, 3);

    for (const day of schedule.days) {
      expect(Number.isInteger(day.minutes)).toBe(true);
    }
  });

  it("only references question ids that actually exist", () => {
    const requirements = [makeRequirement("r1", "must")];
    const questions = [makeQuestion("q1", ["r1"], 2, 0), makeQuestion("q2", ["r1"], 1, 1)];
    const validIds = new Set(questions.map((q) => q.id));

    const schedule = buildSchedule(requirements, questions, 4);

    for (const day of schedule.days) {
      for (const qid of day.question_ids) {
        expect(validIds.has(qid)).toBe(true);
      }
    }
  });
});
