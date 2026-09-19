import type { Requirement, Question } from "../validate/kitSchema";
import type { LLMClient } from "../llm/LLMClient";
import { inlineRunStep, type RunStep } from "../pipeline/runStep";
import { checkCoverage } from "./checkCoverage";
import { fillGaps } from "./fillGaps";

const MAX_PASSES = 3;

export interface CoverageLoopResult {
  questions: Question[];
  uncoveredRequirementIds: string[];
  passes: number;
}

export async function runCoverageLoop(
  requirements: Requirement[],
  initialQuestions: Question[],
  llmClient: LLMClient,
  runStep: RunStep = inlineRunStep
): Promise<CoverageLoopResult> {
  let questions = initialQuestions;
  let uncovered = checkCoverage(requirements, questions);
  let passes = 1;

  while (passes < MAX_PASSES) {
    const uncoveredMustHaves = uncovered.filter((id) =>
      requirements.some((r) => r.id === id && r.priority === "must")
    );

    if (uncoveredMustHaves.length === 0) break;

    const startingOrder = questions.length;
    const currentPass = passes;
    const newQuestions = await runStep(`coverage-fill-${currentPass}`, () =>
      fillGaps(uncoveredMustHaves, requirements, startingOrder, llmClient)
    );
    questions = [...questions, ...newQuestions];

    const nextUncovered = checkCoverage(requirements, questions);
    passes++;

    if (nextUncovered.length === uncovered.length) {
      uncovered = nextUncovered;
      break;
    }

    uncovered = nextUncovered;
  }

  return { questions, uncoveredRequirementIds: uncovered, passes };
}
