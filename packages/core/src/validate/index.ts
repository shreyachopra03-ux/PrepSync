import { Kit, KitSchema } from "./kitSchema";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

function minutesForDifficulty(difficulty: 1 | 2 | 3): number {
  if (difficulty === 1) return 10;
  if (difficulty === 2) return 15;
  return 25;
}

export function validateKit(kit: unknown): ValidationResult {
  const parsed = KitSchema.safeParse(kit);
  if (!parsed.success) {
    return {
      valid: false,
      errors: parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`),
    };
  }

  const errors: string[] = [];
  checkQuestionRequirementRefs(parsed.data, errors);
  checkScheduleQuestionRefs(parsed.data, errors);
  checkMustHaveCoverage(parsed.data, errors);
  checkDayCount(parsed.data, errors);
  checkDayMinutes(parsed.data, errors);

  return { valid: errors.length === 0, errors };
}

function checkQuestionRequirementRefs(kit: Kit, errors: string[]): void {
  const requirementIds = new Set(kit.role.requirements.map((r) => r.id));
  for (const question of kit.questions) {
    for (const reqId of question.requirement_ids) {
      if (!requirementIds.has(reqId)) {
        errors.push(`question ${question.id} references unknown requirement id ${reqId}`);
      }
    }
  }
}

function checkScheduleQuestionRefs(kit: Kit, errors: string[]): void {
  const questionIds = new Set(kit.questions.map((q) => q.id));
  for (const day of kit.schedule.days) {
    for (const qId of day.question_ids) {
      if (!questionIds.has(qId)) {
        errors.push(`schedule day ${day.day} references unknown question id ${qId}`);
      }
    }
  }
}

function checkMustHaveCoverage(kit: Kit, errors: string[]): void {
  const mustHaveIds = kit.role.requirements
    .filter((r) => r.priority === "must")
    .map((r) => r.id);

  const coveredIds = new Set(kit.questions.flatMap((q) => q.requirement_ids));

  for (const reqId of mustHaveIds) {
    if (!coveredIds.has(reqId)) {
      errors.push(`must-have requirement ${reqId} is not covered by any question`);
    }
  }
}

function checkDayCount(kit: Kit, errors: string[]): void {
  if (kit.schedule.days.length !== kit.schedule.days_available) {
    errors.push(
      `schedule has ${kit.schedule.days.length} days but days_available is ${kit.schedule.days_available}`
    );
  }
}

function checkDayMinutes(kit: Kit, errors: string[]): void {
  const questionsById = new Map(kit.questions.map((q) => [q.id, q]));

  for (const day of kit.schedule.days) {
    let expectedMinutes = 0;
    for (const qId of day.question_ids) {
      const question = questionsById.get(qId);
      if (question) {
        expectedMinutes += minutesForDifficulty(question.difficulty);
      }
    }
    if (day.minutes !== expectedMinutes) {
      errors.push(
        `schedule day ${day.day} has minutes ${day.minutes}, expected ${expectedMinutes}`
      );
    }
  }
}
