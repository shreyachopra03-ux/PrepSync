import Link from "next/link";
import type { Kit } from "../lib/types";

interface KitCardProps {
  kit: Kit;
}

export function KitCard({ kit }: KitCardProps) {
  const uncoveredCount = kit.coverage.uncovered_requirement_ids.length;

  return (
    <Link
      href={`/kits/${kit._id}`}
      className="block rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md focus-visible:outline-2 focus-visible:outline-brand-500"
    >
      <p className="text-base font-semibold text-gray-900">{kit.source.company || "Untitled company"}</p>
      <p className="text-sm text-gray-500">{kit.role.title || "Untitled role"}</p>

      <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
        <span>{kit.schedule.days_available} day plan</span>
        <span>{kit.questions.length} questions</span>
        <span>{kit.flashcards.length} flashcards</span>
      </div>

      {uncoveredCount > 0 && (
        <p className="mt-2 text-xs font-medium text-amber-600">
          {uncoveredCount} requirement{uncoveredCount > 1 ? "s" : ""} not yet covered
        </p>
      )}
    </Link>
  );
}
