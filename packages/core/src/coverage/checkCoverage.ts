import type { Requirement, Question } from "../validate/kitSchema";

export function checkCoverage(requirements: Requirement[], questions: Question[]): string[] {
  const coveredIds = new Set(questions.flatMap((q) => q.requirement_ids));

  return requirements
    .filter((requirement) => !coveredIds.has(requirement.id))
    .map((requirement) => requirement.id);
}
