"use client";

import { useEffect, useState } from "react";
import { getNextPracticeCard, submitPracticeConfidence, ApiError } from "../../../../lib/api";
import { track } from "../../../../lib/analytics";
import type { Flashcard, PracticeProgress } from "../../../../lib/types";
import { LoadingState } from "../../../../components/LoadingState";
import { ErrorBanner } from "../../../../components/ErrorBanner";
import { EmptyState } from "../../../../components/EmptyState";
import { FlashcardPractice } from "../../../../components/FlashcardPractice";
import { AppShell, Label, PageHeader, SecondaryLink } from "../../../../components/ds";

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

  const total = progress ? progress.coveredRequirementIds.length + progress.uncoveredRequirementIds.length : 0;
  const covered = progress ? progress.coveredRequirementIds.length : 0;

  return (
    <AppShell width="max-w-2xl">
      <PageHeader
        label="Practice"
        title="One card at a time."
        actions={<SecondaryLink href={`/kits/${kitId}`}>Back to kit</SecondaryLink>}
      />

      {progress && (
        <div className="mb-8">
          <div className="mb-2 flex items-center justify-between">
            <Label className="text-ink-soft">Requirements covered</Label>
            <Label className="text-ink-soft">
              {covered} of {total}
            </Label>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-ink/10">
            <div
              className="h-full rounded-full bg-ink transition-all duration-500"
              style={{ width: total > 0 ? `${(covered / total) * 100}%` : "0%" }}
            />
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4">
          <ErrorBanner message={error} onRetry={loadNext} />
        </div>
      )}

      {!error && loading && <LoadingState message="Loading next card" />}

      {!error && !loading && !card && (
        <EmptyState
          label="Practice"
          title="No flashcards to practise."
          description="This kit doesn't have any flashcards yet."
        />
      )}

      {!error && !loading && card && (
        <FlashcardPractice card={card} onSubmitConfidence={handleConfidence} submitting={submitting} />
      )}
    </AppShell>
  );
}
