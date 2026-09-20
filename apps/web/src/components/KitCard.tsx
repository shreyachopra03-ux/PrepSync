import Link from "next/link";
import type { KitSummary } from "../lib/types";
import { Card, Label, StatusBadge } from "./ds";

interface KitCardProps {
  kit: KitSummary;
  index?: number;
}

export function KitCard({ kit, index }: KitCardProps) {
  const uncoveredCount = kit.uncoveredCount ?? kit.coverage?.uncovered_requirement_ids.length ?? 0;
  const questionCount = kit.questionCount ?? kit.questions?.length ?? 0;
  const flashcardCount = kit.flashcardCount ?? kit.flashcards?.length ?? 0;

  return (
    <Link href={`/kits/${kit._id}`} className="group block">
      <Card interactive className="flex h-full flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <Label className="text-ink/45">{index !== undefined ? String(index + 1).padStart(2, "0") : "Kit"}</Label>
          {uncoveredCount > 0 ? (
            <StatusBadge tone="blush">
              {uncoveredCount} uncovered
            </StatusBadge>
          ) : (
            <StatusBadge tone="lime">Fully covered</StatusBadge>
          )}
        </div>

        <p className="mt-4 font-display text-2xl font-medium leading-tight tracking-tight text-ink">
          {kit.source.company || "Untitled company"}
        </p>
        <p className="mt-1 text-sm text-ink-soft">{kit.role.title || "Untitled role"}</p>

        <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-dashed border-ink/25 pt-3 font-mono text-[0.68rem] text-ink-soft">
          <span>{kit.schedule.days_available}-day plan</span>
          <span>{questionCount} questions</span>
          <span>{flashcardCount} flashcards</span>
          <span aria-hidden="true" className="ml-auto text-ink transition-transform duration-150 group-hover:translate-x-0.5">
            →
          </span>
        </div>
      </Card>
    </Link>
  );
}
