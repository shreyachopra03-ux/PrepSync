import type { ScheduleDay as ScheduleDayType, Question } from "../lib/types";

interface ScheduleDayProps {
  day: ScheduleDayType;
  questions: Question[];
}

export function ScheduleDay({ day, questions }: ScheduleDayProps) {
  const questionsById = new Map(questions.map((q) => [q.id, q]));

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Day {day.day}</h3>
        <span className="text-xs text-gray-500">{day.minutes} min</span>
      </div>
      <p className="mb-3 text-xs font-medium text-brand-600">{day.focus}</p>

      {day.question_ids.length === 0 ? (
        <p className="text-xs text-gray-400">No material scheduled</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {day.question_ids.map((id) => {
            const question = questionsById.get(id);
            return (
              <li key={id} className="truncate text-xs text-gray-600">
                {question ? question.prompt : id}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
