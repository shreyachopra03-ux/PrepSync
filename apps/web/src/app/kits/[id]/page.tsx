"use client";

import { useEffect, useRef, useState } from "react";
import { getKit, patchKit, regenerateSection, ApiError } from "../../../lib/api";
import { track } from "../../../lib/analytics";
import type { Kit, Question, Flashcard } from "../../../lib/types";
import { LoadingState } from "../../../components/LoadingState";
import { ErrorBanner } from "../../../components/ErrorBanner";
import { QuestionItem } from "../../../components/QuestionItem";
import { FlashcardItem } from "../../../components/FlashcardItem";
import { RegenerateButton } from "../../../components/RegenerateButton";
import { ScheduleDay } from "../../../components/ScheduleDay";
import {
  AppShell,
  Card,
  PageHeader,
  PrimaryLink,
  SecondaryLink,
  SectionHeader,
  StatusBadge,
} from "../../../components/ds";

const SAVE_DEBOUNCE_MS = 400;

export default function KitViewPage({ params }: { params: { id: string } }) {
  const kitId = params.id;
  const [kit, setKit] = useState<Kit | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState<"questions" | "flashcards" | null>(null);
  const saveQuestionsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveFlashcardsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function load() {
    setError(null);
    try {
      const result = await getKit(kitId);
      setKit(result.kit);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load this kit");
    }
  }

  useEffect(() => {
    load();
  }, [kitId]);

  function scheduleSave(nextQuestions: Question[]) {
    if (!kit) return;
    const optimisticKit = { ...kit, questions: nextQuestions };
    setKit(optimisticKit);

    if (saveQuestionsTimer.current) clearTimeout(saveQuestionsTimer.current);
    saveQuestionsTimer.current = setTimeout(async () => {
      try {
        const result = await patchKit(kitId, optimisticKit.version, { questions: nextQuestions });
        setKit(result.kit);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Failed to save your changes");
      }
    }, SAVE_DEBOUNCE_MS);
  }

  function handleEdit(updated: Question) {
    if (!kit) return;
    const edited: Question = { ...updated, origin: "edited", rev: updated.rev + 1 };
    scheduleSave(kit.questions.map((q) => (q.id === edited.id ? edited : q)));
  }

  function handleDelete(id: string) {
    if (!kit) return;
    scheduleSave(kit.questions.filter((q) => q.id !== id));
  }

  function handleTogglePin(id: string) {
    if (!kit) return;
    scheduleSave(kit.questions.map((q) => (q.id === id ? { ...q, pinned: !q.pinned } : q)));
  }

  function scheduleSaveFlashcards(nextFlashcards: Flashcard[]) {
    if (!kit) return;
    const optimisticKit = { ...kit, flashcards: nextFlashcards };
    setKit(optimisticKit);

    if (saveFlashcardsTimer.current) clearTimeout(saveFlashcardsTimer.current);
    saveFlashcardsTimer.current = setTimeout(async () => {
      try {
        const result = await patchKit(kitId, optimisticKit.version, { flashcards: nextFlashcards });
        setKit(result.kit);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Failed to save your changes");
      }
    }, SAVE_DEBOUNCE_MS);
  }

  function handleFlashcardEdit(updated: Flashcard) {
    if (!kit) return;
    const edited: Flashcard = { ...updated, origin: "edited" };
    scheduleSaveFlashcards(kit.flashcards.map((f) => (f.id === edited.id ? edited : f)));
  }

  function handleFlashcardDelete(id: string) {
    if (!kit) return;
    scheduleSaveFlashcards(kit.flashcards.filter((f) => f.id !== id));
  }

  function handleFlashcardTogglePin(id: string) {
    if (!kit) return;
    scheduleSaveFlashcards(kit.flashcards.map((f) => (f.id === id ? { ...f, pinned: !f.pinned } : f)));
  }

  function handleMove(id: string, direction: -1 | 1) {
    if (!kit) return;
    const sorted = [...kit.questions].sort((a, b) => a.order - b.order);
    const index = sorted.findIndex((q) => q.id === id);
    const swapIndex = index + direction;
    if (index === -1 || swapIndex < 0 || swapIndex >= sorted.length) return;

    const a = sorted[index];
    const b = sorted[swapIndex];
    const swappedOrder = a.order;
    a.order = b.order;
    b.order = swappedOrder;

    scheduleSave(sorted);
  }

  async function handleRegenerate(section: "questions" | "flashcards") {
    if (!kit) return;
    setRegenerating(section);
    try {
      const result = await regenerateSection(kitId, section, kit.version);
      track("kit_section_regenerated", { section });
      setKit(result.kit);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : `Failed to regenerate ${section}`);
    } finally {
      setRegenerating(null);
    }
  }

  if (error) {
    return (
      <AppShell>
        <ErrorBanner message={error} onRetry={load} />
      </AppShell>
    );
  }

  if (!kit) {
    return (
      <AppShell>
        <LoadingState message="Loading kit" />
      </AppShell>
    );
  }

  const sortedQuestions = [...kit.questions].sort((a, b) => a.order - b.order);
  const protectedQuestionCount = kit.questions.filter(
    (q) => q.pinned || q.origin !== "generated"
  ).length;
  const protectedFlashcardCount = kit.flashcards.filter(
    (f) => f.pinned || f.origin !== "generated"
  ).length;
  const uncoveredCount = kit.coverage.uncovered_requirement_ids.length;

  return (
    <AppShell>
      <PageHeader
        label="Prep kit"
        title={kit.source.company || "Untitled company"}
        description={kit.role.title || "Untitled role"}
        actions={
          <>
            <SecondaryLink href="/dashboard">All kits</SecondaryLink>
            <PrimaryLink href={`/kits/${kit._id}/practice`}>Practice</PrimaryLink>
          </>
        }
      />

      <div className="-mt-4 mb-10 flex flex-wrap items-center gap-2">
        <StatusBadge>{kit.schedule.days_available}-day plan</StatusBadge>
        <StatusBadge>{kit.questions.length} questions</StatusBadge>
        <StatusBadge>{kit.flashcards.length} flashcards</StatusBadge>
        {uncoveredCount > 0 ? (
          <StatusBadge tone="blush">{uncoveredCount} uncovered</StatusBadge>
        ) : (
          <StatusBadge tone="lime">Fully covered</StatusBadge>
        )}
      </div>

      {kit.source.pages_used.length === 0 && (
        <div className="mb-10">
          <ErrorBanner message="We couldn't reach the company site, so this brief is based on the job description alone." />
        </div>
      )}

      <section className="mb-16">
        <SectionHeader n="01" label="Role requirements" title="What the role asks for" />
        <Card className="p-6">
          <ul className="flex flex-col gap-3">
            {kit.role.requirements.map((r) => (
              <li key={r.id} className="flex items-start gap-3 text-sm leading-relaxed text-ink">
                <span className="mt-0.5 shrink-0">
                  <StatusBadge tone={r.priority === "must" ? "lime" : "neutral"}>{r.priority}</StatusBadge>
                </span>
                {r.text}
              </li>
            ))}
          </ul>
          {uncoveredCount > 0 && (
            <p className="mt-5 border-t border-dashed border-ink/25 pt-4 font-mono text-xs text-[#8A2626]">
              {uncoveredCount} requirement(s) not yet covered by a question
            </p>
          )}
        </Card>
      </section>

      <section className="mb-16">
        <SectionHeader n="02" label="Company context" title="Who you are talking to" />
        <Card tone="blush" className="p-6 sm:p-8">
          <p className="font-display text-xl leading-snug tracking-tight text-ink sm:text-2xl">
            {kit.company_brief.summary}
          </p>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ink-soft">{kit.company_brief.what_they_do}</p>
        </Card>
      </section>

      <section className="mb-16">
        <SectionHeader
          n="03"
          label="Likely questions"
          title="Question bank"
          action={
            <RegenerateButton
              sectionLabel="questions"
              pinnedCount={protectedQuestionCount}
              disabled={regenerating !== null}
              onConfirm={() => handleRegenerate("questions")}
            />
          }
        />
        {regenerating === "questions" ? (
          <LoadingState message="Regenerating questions" />
        ) : (
          <ul className="flex flex-col gap-4">
            {sortedQuestions.map((q) => (
              <QuestionItem
                key={q.id}
                question={q}
                onEdit={handleEdit}
                onDelete={() => handleDelete(q.id)}
                onTogglePin={() => handleTogglePin(q.id)}
                onMoveUp={() => handleMove(q.id, -1)}
                onMoveDown={() => handleMove(q.id, 1)}
              />
            ))}
          </ul>
        )}
      </section>

      <section className="mb-16">
        <SectionHeader
          n="04"
          label="Flashcards"
          title="Quick recall"
          action={
            <RegenerateButton
              sectionLabel="flashcards"
              pinnedCount={protectedFlashcardCount}
              disabled={regenerating !== null}
              onConfirm={() => handleRegenerate("flashcards")}
            />
          }
        />
        {regenerating === "flashcards" ? (
          <LoadingState message="Regenerating flashcards" />
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {kit.flashcards.map((f) => (
              <FlashcardItem
                key={f.id}
                flashcard={f}
                onEdit={handleFlashcardEdit}
                onDelete={() => handleFlashcardDelete(f.id)}
                onTogglePin={() => handleFlashcardTogglePin(f.id)}
              />
            ))}
          </ul>
        )}
      </section>

      <section>
        <SectionHeader n="05" label="Your prep plan" title="Day by day" />
        <div className="grid gap-4 sm:grid-cols-2">
          {kit.schedule.days.map((day) => (
            <ScheduleDay key={day.day} day={day} questions={kit.questions} />
          ))}
        </div>
      </section>
    </AppShell>
  );
}
