"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { getKit, patchKit, regenerateSection, ApiError } from "../../../lib/api";
import type { Kit, Question, Flashcard } from "../../../lib/types";
import { LoadingState } from "../../../components/LoadingState";
import { ErrorBanner } from "../../../components/ErrorBanner";
import { QuestionItem } from "../../../components/QuestionItem";
import { FlashcardItem } from "../../../components/FlashcardItem";
import { RegenerateButton } from "../../../components/RegenerateButton";
import { ScheduleDay } from "../../../components/ScheduleDay";

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
      setKit(result.kit);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : `Failed to regenerate ${section}`);
    } finally {
      setRegenerating(null);
    }
  }

  if (error) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-10">
        <ErrorBanner message={error} onRetry={load} />
      </main>
    );
  }

  if (!kit) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-10">
        <LoadingState message="Loading kit..." />
      </main>
    );
  }

  const sortedQuestions = [...kit.questions].sort((a, b) => a.order - b.order);
  const protectedQuestionCount = kit.questions.filter(
    (q) => q.pinned || q.origin !== "generated"
  ).length;
  const protectedFlashcardCount = kit.flashcards.filter(
    (f) => f.pinned || f.origin !== "generated"
  ).length;

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {kit.source.company || "Untitled company"}
          </h1>
          <p className="text-sm text-gray-500">{kit.role.title || "Untitled role"}</p>
        </div>
        <Link
          href={`/kits/${kit._id}/practice`}
          className="rounded-md bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
        >
          Practice
        </Link>
      </div>

      {kit.source.pages_used.length === 0 && (
        <div className="mb-6">
          <ErrorBanner message="We couldn't reach the company site, so this brief is based on the job description alone." />
        </div>
      )}

      <section className="mb-8">
        <h2 className="mb-2 text-lg font-semibold text-gray-900">Company brief</h2>
        <p className="text-sm text-gray-700">{kit.company_brief.summary}</p>
        <p className="mt-1 text-sm text-gray-500">{kit.company_brief.what_they_do}</p>
      </section>

      <section className="mb-8">
        <h2 className="mb-2 text-lg font-semibold text-gray-900">Role breakdown</h2>
        <ul className="flex flex-col gap-1">
          {kit.role.requirements.map((r) => (
            <li key={r.id} className="text-sm text-gray-700">
              <span
                className={
                  r.priority === "must"
                    ? "mr-2 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700"
                    : "mr-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600"
                }
              >
                {r.priority}
              </span>
              {r.text}
            </li>
          ))}
        </ul>
        {kit.coverage.uncovered_requirement_ids.length > 0 && (
          <p className="mt-2 text-xs font-medium text-amber-600">
            {kit.coverage.uncovered_requirement_ids.length} requirement(s) not yet covered by a
            question
          </p>
        )}
      </section>

      <section className="mb-8">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Question bank</h2>
          <RegenerateButton
            sectionLabel="questions"
            pinnedCount={protectedQuestionCount}
            disabled={regenerating !== null}
            onConfirm={() => handleRegenerate("questions")}
          />
        </div>
        {regenerating === "questions" ? (
          <LoadingState message="Regenerating questions..." />
        ) : (
          <ul className="flex flex-col gap-3">
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

      <section className="mb-8">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Flashcards</h2>
          <RegenerateButton
            sectionLabel="flashcards"
            pinnedCount={protectedFlashcardCount}
            disabled={regenerating !== null}
            onConfirm={() => handleRegenerate("flashcards")}
          />
        </div>
        {regenerating === "flashcards" ? (
          <LoadingState message="Regenerating flashcards..." />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
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
        <h2 className="mb-2 text-lg font-semibold text-gray-900">Schedule</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {kit.schedule.days.map((day) => (
            <ScheduleDay key={day.day} day={day} questions={kit.questions} />
          ))}
        </div>
      </section>
    </main>
  );
}
