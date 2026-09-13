import { describe, it, expect, vi } from "vitest";
import { checkCoverage } from "../src/coverage/checkCoverage";
import { runCoverageLoop } from "../src/coverage/coverageLoop";
import type { Requirement, Question } from "../src/validate/kitSchema";
import type { LLMClient } from "../src/llm/LLMClient";

function makeRequirement(id: string, priority: "must" | "nice"): Requirement {
  return { id, text: `requirement ${id}`, kind: "technical", priority };
}

function makeQuestion(id: string, requirementIds: string[]): Question {
  return {
    id,
    requirement_ids: requirementIds,
    category: "technical",
    prompt: `prompt ${id}`,
    answer_outline: "outline",
    difficulty: 2,
    origin: "generated",
    pinned: false,
    order: 0,
    rev: 1,
  };
}

describe("checkCoverage", () => {
  it("returns an empty list when every requirement is covered", () => {
    const requirements = [makeRequirement("r1", "must")];
    const questions = [makeQuestion("q1", ["r1"])];
    expect(checkCoverage(requirements, questions)).toEqual([]);
  });

  it("returns ids of requirements not covered by any question", () => {
    const requirements = [makeRequirement("r1", "must"), makeRequirement("r2", "nice")];
    const questions = [makeQuestion("q1", ["r1"])];
    expect(checkCoverage(requirements, questions)).toEqual(["r2"]);
  });
});

describe("runCoverageLoop", () => {
  it("stops immediately when all must-haves are already covered", async () => {
    const requirements = [makeRequirement("r1", "must")];
    const initialQuestions = [makeQuestion("q1", ["r1"])];
    const fakeLLM: LLMClient = { generateText: vi.fn() };

    const result = await runCoverageLoop(requirements, initialQuestions, fakeLLM);

    expect(result.passes).toBe(1);
    expect(fakeLLM.generateText).not.toHaveBeenCalled();
  });

  it("calls fillGaps for uncovered must-haves and stops once covered", async () => {
    const requirements = [makeRequirement("r1", "must"), makeRequirement("r2", "must")];
    const initialQuestions = [makeQuestion("q1", ["r1"])];

    const fakeLLM: LLMClient = {
      generateText: vi.fn().mockResolvedValue(
        JSON.stringify([
          {
            requirement_ids: ["r2"],
            category: "technical",
            prompt: "fill-gap prompt",
            answer_outline: "outline",
            difficulty: 2,
          },
        ])
      ),
    };

    const result = await runCoverageLoop(requirements, initialQuestions, fakeLLM);

    expect(result.uncoveredRequirementIds).toEqual([]);
    expect(result.passes).toBe(2);
    expect(result.questions.length).toBe(2);
  });

  it("stops after max passes when no progress is being made", async () => {
    const requirements = [makeRequirement("r1", "must")];
    const initialQuestions: Question[] = [];

    const fakeLLM: LLMClient = {
      generateText: vi.fn().mockResolvedValue(JSON.stringify([])),
    };

    const result = await runCoverageLoop(requirements, initialQuestions, fakeLLM);

    expect(result.uncoveredRequirementIds).toEqual(["r1"]);
    expect(result.passes).toBeLessThanOrEqual(3);
  });
});
