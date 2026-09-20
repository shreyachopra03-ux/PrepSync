"use client";

import { useEffect, useState } from "react";
import { getNextPracticeCard, submitPracticeConfidence, ApiError } from "../../../../lib/api";
import { track } from "../../../../lib/analytics";
import type { Flashcard, PracticeProgress } from "../../../../lib/types";
import { LoadingState } from "../../../../components/LoadingState";
import { ErrorBanner } from "../../../../components/ErrorBanner";
import { EmptyState } from "../../../../components/EmptyState";
import { FlashcardPractice } from "../../../../components/FlashcardPractice";

export default function PracticePage({ params }: { params: { id: string } }) {
  const kitId = params.id;
  const [card, setCard] = useState<Flashcard | null>(null);
  const [progress, setProgress] = useState<PracticeProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  async function loadNext() {
    setError(null);
    setLoading(true);
    try {
      const result = await getNextPracticeCard(kitId);
      setCard(result.card);
      setProgress(result.progress);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load the next card");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNext();
  }, [kitId]);

  async function handleConfidence(confidence: 1 | 2 | 3) {
    if (!card) return;
    setSubmitting(true);
    try {
      await submitPracticeConfidence(kitId, card.id, confidence);
      track("practice_card_rated", { confidence });
      await loadNext();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save your answer");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-2 text-center text-2xl font-semibold text-gray-900">Practice</h1>

      {progress && (
        <p className="mb-8 text-center text-sm text-gray-500">
          {progress.coveredRequirementIds.length} of{" "}
          {progress.coveredRequirementIds.length + progress.uncoveredRequirementIds.length}{" "}
          requirements covered
        </p>
      )}

      {error && (
        <div className="mb-4">
          <ErrorBanner message={error} onRetry={loadNext} />
        </div>
      )}

      {!error && loading && <LoadingState message="Loading next card..." />}

      {!error && !loading && !card && (
        <EmptyState
          title="No flashcards to practice"
          description="This kit doesn't have any flashcards yet."
        />
      )}

      {!error && !loading && card && (
        <FlashcardPractice card={card} onSubmitConfidence={handleConfidence} submitting={submitting} />
      )}
    </main>
  );
}
