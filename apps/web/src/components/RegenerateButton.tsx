"use client";

import { useState } from "react";

interface RegenerateButtonProps {
  sectionLabel: string;
  pinnedCount: number;
  onConfirm: () => void;
  disabled?: boolean;
}

export function RegenerateButton({
  sectionLabel,
  pinnedCount,
  onConfirm,
  disabled,
}: RegenerateButtonProps) {
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <div className="flex flex-col gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
        <p>
          This will replace {sectionLabel} you haven&apos;t edited or pinned.
          {pinnedCount > 0
            ? ` Your ${pinnedCount} pinned/edited item${pinnedCount > 1 ? "s" : ""} will be kept.`
            : ""}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              onConfirm();
              setConfirming(false);
            }}
            className="rounded-md bg-amber-600 px-3 py-1 text-xs font-medium text-white hover:bg-amber-700"
          >
            Regenerate
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="rounded-md border border-amber-300 px-3 py-1 text-xs font-medium hover:bg-amber-100"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => setConfirming(true)}
      className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-brand-500"
    >
      Regenerate {sectionLabel}
    </button>
  );
}
