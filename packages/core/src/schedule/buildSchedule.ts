import type { Requirement, Question, Schedule, ScheduleDay } from "../validate/kitSchema";

const CAP_MULTIPLIER = 1.25;

function minutesForDifficulty(difficulty: 1 | 2 | 3): number {
  if (difficulty === 1) return 10;
  if (difficulty === 2) return 15;
  return 25;
}

function coversAMustHave(question: Question, requirements: Requirement[]): boolean {
  return question.requirement_ids.some(
    (id) => requirements.find((r) => r.id === id)?.priority === "must"
  );
}

function weightOf(question: Question, requirements: Requirement[]): number {
  return question.difficulty * (coversAMustHave(question, requirements) ? 2 : 1);
}

function focusFor(questions: Question[]): string {
  if (questions.length === 0) return "No material available";
  const categories = Array.from(new Set(questions.map((q) => q.category)));
  return categories.join(", ");
}

export function buildSchedule(
  requirements: Requirement[],
  questions: Question[],
  daysAvailable: number
): Schedule {
  if (daysAvailable === 1) {
    return {
      days_available: 1,
      days: [
        {
          day: 1,
          focus: "Full sweep",
          question_ids: questions.map((q) => q.id),
          minutes: questions.reduce((sum, q) => sum + minutesForDifficulty(q.difficulty), 0),
        },
      ],
    };
  }

  const sortedQuestions = [...questions].sort((a, b) => {
    const weightDiff = weightOf(b, requirements) - weightOf(a, requirements);
    if (weightDiff !== 0) return weightDiff;
    return Number(coversAMustHave(b, requirements)) - Number(coversAMustHave(a, requirements));
  });

  const totalMinutes = sortedQuestions.reduce(
    (sum, q) => sum + minutesForDifficulty(q.difficulty),
    0
  );
  const cap = (totalMinutes / daysAvailable) * CAP_MULTIPLIER;

  const contentDays: { questions: Question[]; minutes: number }[] = [];
  let currentQuestions: Question[] = [];
  let currentMinutes = 0;

  for (const question of sortedQuestions) {
    const minutes = minutesForDifficulty(question.difficulty);
    const isLastAvailableDay = contentDays.length >= daysAvailable - 1;

    if (currentQuestions.length === 0 || currentMinutes + minutes <= cap || isLastAvailableDay) {
      currentQuestions.push(question);
      currentMinutes += minutes;
    } else {
      contentDays.push({ questions: currentQuestions, minutes: currentMinutes });
      currentQuestions = [question];
      currentMinutes = minutes;
    }
  }

  if (currentQuestions.length > 0 || contentDays.length === 0) {
    contentDays.push({ questions: currentQuestions, minutes: currentMinutes });
  }

  const days: ScheduleDay[] = contentDays.map((content, index) => ({
    day: index + 1,
    focus: focusFor(content.questions),
    question_ids: content.questions.map((q) => q.id),
    minutes: content.minutes,
  }));

  const reviewDaysNeeded = daysAvailable - days.length;
  for (let i = 0; i < reviewDaysNeeded; i++) {
    const sourceDay = days[i % days.length];
    const dayNumber = days.length + i + 1;
    days.push({
      day: dayNumber,
      focus: sourceDay
        ? `Review: material from day ${sourceDay.day}`
        : "No material available",
      question_ids: sourceDay ? sourceDay.question_ids : [],
      minutes: sourceDay ? sourceDay.minutes : 0,
    });
  }

  return { days_available: daysAvailable, days };
}
