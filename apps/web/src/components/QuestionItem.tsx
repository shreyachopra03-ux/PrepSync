"use client";

import { useState } from "react";
import type { Question } from "../lib/types";

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
    <li id={`question-${question.id}`} className="scroll-mt-4 rounded-md border border-gray-200 bg-white p-4">
      <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
        <span className="rounded-full bg-gray-100 px-2 py-0.5">{question.category}</span>
        <span className="rounded-full bg-gray-100 px-2 py-0.5">
          {DIFFICULTY_LABELS[question.difficulty]}
        </span>
        {question.origin === "edited" && (
          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-blue-700">Edited</span>
        )}
        {question.origin === "manual" && (
          <span className="rounded-full bg-purple-100 px-2 py-0.5 text-purple-700">Manual</span>
        )}
        {question.pinned && (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-700">Pinned</span>
        )}
      </div>

      {isEditing ? (
        <div className="flex flex-col gap-2">
          <textarea
            value={draftPrompt}
            onChange={(e) => setDraftPrompt(e.target.value)}
            rows={2}
            className="rounded-md border border-gray-300 px-2 py-1 text-sm focus-visible:outline-2 focus-visible:outline-brand-500"
          />
          <textarea
            value={draftOutline}
            onChange={(e) => setDraftOutline(e.target.value)}
            rows={3}
            className="rounded-md border border-gray-300 px-2 py-1 text-sm focus-visible:outline-2 focus-visible:outline-brand-500"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={saveEdit}
              className="rounded-md bg-brand-500 px-3 py-1 text-xs font-medium text-white hover:bg-brand-600"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="rounded-md border border-gray-300 px-3 py-1 text-xs font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <p className="text-sm font-medium text-gray-900">{question.prompt}</p>
          <p className="mt-1 text-sm text-gray-600">{question.answer_outline}</p>
        </>
      )}

      {!isEditing && (
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="rounded-md border border-gray-300 px-2 py-1 text-xs font-medium hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-brand-500"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={onTogglePin}
            className="rounded-md border border-gray-300 px-2 py-1 text-xs font-medium hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-brand-500"
          >
            {question.pinned ? "Unpin" : "Pin"}
          </button>
          <button
            type="button"
            onClick={onMoveUp}
            aria-label="Move question up"
            className="rounded-md border border-gray-300 px-2 py-1 text-xs font-medium hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-brand-500"
          >
            ↑
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            aria-label="Move question down"
            className="rounded-md border border-gray-300 px-2 py-1 text-xs font-medium hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-brand-500"
          >
            ↓
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="ml-auto rounded-md border border-red-300 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-red-500"
          >
            Delete
          </button>
        </div>
      )}
    </li>
  );
}
