"use client";

import { useEffect, useState } from "react";
import type { Flashcard } from "../lib/types";
import { Card, Label, PrimaryButton, btnSecondary } from "./ds";

interface FlashcardPracticeProps {
  card: Flashcard;
  onSubmitConfidence: (confidence: 1 | 2 | 3) => void;
  submitting?: boolean;
}

const RATINGS: { value: 1 | 2 | 3; label: string; tone: string }[] = [
  { value: 1, label: "Again", tone: "hover:!bg-blush" },
  { value: 2, label: "Good", tone: "hover:!bg-sky" },
  { value: 3, label: "Easy", tone: "hover:!bg-lime" },
];

export function FlashcardPractice({ card, onSubmitConfidence, submitting }: FlashcardPracticeProps) {
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    setRevealed(false);
  }, [card.id]);

  return (
    <div className="flex flex-col gap-6">
      <Card tone={revealed ? "sky" : "paper"} className="flex min-h-[15rem] flex-col justify-center p-7 sm:p-10">
        <Label className="text-ink/50">{revealed ? "Answer" : "Question"}</Label>
        <p className="mt-3 font-display text-2xl font-medium leading-snug tracking-tight text-ink sm:text-3xl">
          {card.front}
        </p>
        {revealed && (
          <p className="mt-5 border-t border-dashed border-ink/30 pt-5 text-[0.95rem] leading-relaxed text-ink-soft">
            {card.back}
          </p>
        )}
      </Card>

      {!revealed ? (
        <div>
          <PrimaryButton type="button" onClick={() => setRevealed(true)}>
            Reveal answer
          </PrimaryButton>
        </div>
      ) : (
        <div>
          <Label className="text-ink-soft">How did that feel?</Label>
          <div className="mt-3 flex flex-wrap gap-3">
            {RATINGS.map((rating) => (
              <button
                key={rating.value}
                type="button"
                disabled={submitting}
                onClick={() => onSubmitConfidence(rating.value)}
                className={`${btnSecondary} min-w-[6rem] ${rating.tone}`}
              >
                <span className="font-mono text-[0.65rem] text-ink/50">{rating.value}</span>
                {rating.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
