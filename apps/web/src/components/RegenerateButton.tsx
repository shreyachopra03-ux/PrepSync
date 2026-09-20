"use client";

import { useState } from "react";
import { btnSmall, btnSmallPrimary } from "./ds";

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
      <div className="flex max-w-sm flex-col gap-3 rounded-md border border-ink/70 bg-blush p-3.5 text-sm leading-relaxed text-ink">
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
            className={btnSmallPrimary}
          >
            Regenerate
          </button>
          <button type="button" onClick={() => setConfirming(false)} className={btnSmall}>
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <button type="button" disabled={disabled} onClick={() => setConfirming(true)} className={btnSmall}>
      Regenerate {sectionLabel}
    </button>
  );
}
