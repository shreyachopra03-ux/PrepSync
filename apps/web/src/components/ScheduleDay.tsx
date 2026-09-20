import type { ScheduleDay as ScheduleDayType, Question } from "../lib/types";
import { Card, Label, StatusBadge } from "./ds";

interface ScheduleDayProps {
  day: ScheduleDayType;
  questions: Question[];
}

export function ScheduleDay({ day, questions }: ScheduleDayProps) {
  const questionsById = new Map(questions.map((q) => [q.id, q]));

  return (
    <Card interactive className="p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <span className="font-display text-4xl leading-none text-transparent [-webkit-text-stroke:1.2px_#0F1729]">
            {String(day.day).padStart(2, "0")}
          </span>
          <Label className="text-ink-soft">Day {day.day}</Label>
        </div>
        <StatusBadge>{day.minutes} min</StatusBadge>
      </div>
      <p className="mb-3 font-display text-base italic leading-snug text-ink">{day.focus}</p>

      {day.question_ids.length === 0 ? (
        <p className="text-xs text-ink/50">No material scheduled</p>
      ) : (
        <ul className="flex flex-col gap-1.5 border-t border-dashed border-ink/25 pt-3">
          {day.question_ids.map((id) => {
            const question = questionsById.get(id);
            return (
              <li key={id}>
                <a
                  href={`#question-${id}`}
                  className="block text-xs leading-relaxed text-ink-soft underline-offset-2 transition-colors hover:text-ink hover:underline"
                >
                  {question ? question.prompt : id}
                </a>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
