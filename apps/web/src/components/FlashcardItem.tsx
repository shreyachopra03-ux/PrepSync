"use client";

import { useState } from "react";
import type { Flashcard } from "../lib/types";
import { Card, Label, StatusBadge, btnSmall, btnSmallDanger, btnSmallPrimary, inputClass } from "./ds";

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
    <li>
      <Card className={`h-full p-4 ${flashcard.pinned ? "!bg-[#F6F9DA]" : ""}`}>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Label className="text-ink/45">Card</Label>
          {flashcard.origin === "edited" && <StatusBadge tone="blush">Edited</StatusBadge>}
          {flashcard.origin === "manual" && <StatusBadge tone="blush">Manual</StatusBadge>}
          {flashcard.pinned && <StatusBadge tone="lime">Pinned</StatusBadge>}
        </div>

        {isEditing ? (
          <div className="flex flex-col gap-3">
            <textarea
              value={draftFront}
              onChange={(e) => setDraftFront(e.target.value)}
              rows={2}
              aria-label="Front"
              className={inputClass}
            />
            <textarea
              value={draftBack}
              onChange={(e) => setDraftBack(e.target.value)}
              rows={3}
              aria-label="Back"
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
            <p className="font-display text-base font-medium leading-snug text-ink">{flashcard.front}</p>
            <p className="mt-2 border-l-2 border-ink/25 pl-3 text-sm leading-relaxed text-ink-soft">{flashcard.back}</p>
          </>
        )}

        {!isEditing && (
          <div className="mt-4 flex flex-wrap gap-2 border-t border-dashed border-ink/25 pt-3">
            <button type="button" onClick={() => setIsEditing(true)} className={btnSmall}>
              Edit
            </button>
            <button type="button" onClick={onTogglePin} className={btnSmall}>
              {flashcard.pinned ? "Unpin" : "Pin"}
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
