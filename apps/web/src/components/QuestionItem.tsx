"use client";

import { useState } from "react";
import type { Question } from "../lib/types";
import { Card, StatusBadge, btnSmall, btnSmallDanger, btnSmallPrimary, inputClass } from "./ds";

interface QuestionItemProps {
  question: Question;
  onEdit: (updated: Question) => void;
  onDelete: () => void;
  onTogglePin: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

const DIFFICULTY_LABELS: Record<1 | 2 | 3, string> = {
  1: "Easy",
  2: "Medium",
  3: "Hard",
};

function difficultyDots(level: 1 | 2 | 3): string {
  return "●".repeat(level) + "○".repeat(3 - level);
}

export function QuestionItem({
  question,
  onEdit,
  onDelete,
  onTogglePin,
  onMoveUp,
  onMoveDown,
}: QuestionItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftPrompt, setDraftPrompt] = useState(question.prompt);
  const [draftOutline, setDraftOutline] = useState(question.answer_outline);

  function saveEdit() {
    onEdit({ ...question, prompt: draftPrompt, answer_outline: draftOutline });
    setIsEditing(false);
  }

  return (
    <li id={`question-${question.id}`} className="scroll-mt-6">
      <Card className={`p-5 ${question.pinned ? "!bg-[#F6F9DA]" : ""}`}>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <StatusBadge tone="sky">{question.category}</StatusBadge>
          <StatusBadge>
            {DIFFICULTY_LABELS[question.difficulty]} {difficultyDots(question.difficulty)}
          </StatusBadge>
          {question.origin === "edited" && <StatusBadge tone="blush">Edited</StatusBadge>}
          {question.origin === "manual" && <StatusBadge tone="blush">Manual</StatusBadge>}
          {question.pinned && <StatusBadge tone="lime">Pinned</StatusBadge>}
        </div>

        {isEditing ? (
          <div className="flex flex-col gap-3">
            <textarea
              value={draftPrompt}
              onChange={(e) => setDraftPrompt(e.target.value)}
              rows={2}
              aria-label="Question"
              className={inputClass}
            />
            <textarea
              value={draftOutline}
              onChange={(e) => setDraftOutline(e.target.value)}
              rows={4}
              aria-label="Answer outline"
              className={inputClass}
            />
            <div className="flex gap-2">
              <button type="button" onClick={saveEdit} className={btnSmallPrimary}>
                Save
              </button>
              <button type="button" onClick={() => setIsEditing(false)} className={btnSmall}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="font-display text-lg font-medium leading-snug text-ink">{question.prompt}</p>
            <p className="mt-3 border-l-2 border-ink/25 pl-3 text-sm leading-relaxed text-ink-soft">
              {question.answer_outline}
            </p>
          </>
        )}

        {!isEditing && (
          <div className="mt-4 flex flex-wrap gap-2 border-t border-dashed border-ink/25 pt-3">
            <button type="button" onClick={() => setIsEditing(true)} className={btnSmall}>
              Edit
            </button>
            <button type="button" onClick={onTogglePin} className={btnSmall}>
              {question.pinned ? "Unpin" : "Pin"}
            </button>
            <button type="button" onClick={onMoveUp} aria-label="Move question up" className={btnSmall}>
              ↑
            </button>
            <button type="button" onClick={onMoveDown} aria-label="Move question down" className={btnSmall}>
              ↓
            </button>
            <button type="button" onClick={onDelete} className={`${btnSmallDanger} ml-auto`}>
              Delete
            </button>
          </div>
        )}
      </Card>
    </li>
  );
}
