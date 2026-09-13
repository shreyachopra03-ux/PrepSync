"use client";

import { useEffect, useState } from "react";
import type { Flashcard } from "../lib/types";

interface FlashcardPracticeProps {
  card: Flashcard;
  onSubmitConfidence: (confidence: 1 | 2 | 3) => void;
  submitting?: boolean;
}

export function FlashcardPractice({ card, onSubmitConfidence, submitting }: FlashcardPracticeProps) {
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    setRevealed(false);
  }, [card.id]);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-6">
      <div className="flex min-h-[10rem] w-full flex-col items-center justify-center rounded-lg border border-gray-200 bg-white p-6 text-center shadow-sm">
        <p className="text-lg font-medium text-gray-900">{card.front}</p>
        {revealed && <p className="mt-4 text-sm text-gray-600">{card.back}</p>}
      </div>

      {!revealed ? (
        <button
          type="button"
          onClick={() => setRevealed(true)}
          className="rounded-md bg-brand-500 px-5 py-2 text-sm font-medium text-white hover:bg-brand-600 focus-visible:outline-2 focus-visible:outline-brand-700"
        >
          Reveal answer
        </button>
      ) : (
        <div className="flex gap-3">
          <button
            type="button"
            disabled={submitting}
            onClick={() => onSubmitConfidence(1)}
            className="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
          >
            Again
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={() => onSubmitConfidence(2)}
            className="rounded-md border border-amber-300 px-4 py-2 text-sm font-medium text-amber-700 hover:bg-amber-50 disabled:opacity-50"
          >
            Good
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={() => onSubmitConfidence(3)}
            className="rounded-md border border-green-300 px-4 py-2 text-sm font-medium text-green-700 hover:bg-green-50 disabled:opacity-50"
          >
            Easy
          </button>
        </div>
      )}
    </div>
  );
}
