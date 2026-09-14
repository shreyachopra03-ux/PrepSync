"use client";

import { useState } from "react";
import type { Flashcard } from "../lib/types";

interface FlashcardItemProps {
  flashcard: Flashcard;
  onEdit: (updated: Flashcard) => void;
  onDelete: () => void;
  onTogglePin: () => void;
}

export function FlashcardItem({ flashcard, onEdit, onDelete, onTogglePin }: FlashcardItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftFront, setDraftFront] = useState(flashcard.front);
  const [draftBack, setDraftBack] = useState(flashcard.back);

  function saveEdit() {
    onEdit({ ...flashcard, front: draftFront, back: draftBack });
    setIsEditing(false);
  }

  return (
    <li className="rounded-md border border-gray-200 bg-white p-3">
      <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
        {flashcard.origin === "edited" && (
          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-blue-700">Edited</span>
        )}
        {flashcard.origin === "manual" && (
          <span className="rounded-full bg-purple-100 px-2 py-0.5 text-purple-700">Manual</span>
        )}
        {flashcard.pinned && (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-700">Pinned</span>
        )}
      </div>

      {isEditing ? (
        <div className="flex flex-col gap-2">
          <textarea
            value={draftFront}
            onChange={(e) => setDraftFront(e.target.value)}
            rows={2}
            className="rounded-md border border-gray-300 px-2 py-1 text-sm focus-visible:outline-2 focus-visible:outline-brand-500"
          />
          <textarea
            value={draftBack}
            onChange={(e) => setDraftBack(e.target.value)}
            rows={2}
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
          <p className="text-sm font-medium text-gray-900">{flashcard.front}</p>
          <p className="mt-1 text-sm text-gray-600">{flashcard.back}</p>
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
            {flashcard.pinned ? "Unpin" : "Pin"}
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
