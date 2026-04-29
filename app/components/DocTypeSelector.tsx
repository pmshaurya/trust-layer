// app/components/DocTypeSelector.tsx
//
// Step 1: Doc Type Selector.
// Renders one card per entry in DOC_TYPES (lib/doc-types.ts).
// Disabled cards are visibly dimmed and unclickable.

import type { DocType } from "@/lib/types";
import { DOC_TYPES } from "@/lib/doc-types";

interface DocTypeSelectorProps {
  selected: DocType | null;
  onSelect: (docType: DocType | null) => void;
}

export default function DocTypeSelector({
  selected,
  onSelect,
}: DocTypeSelectorProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {DOC_TYPES.map((dt) => {
        const isSelected = selected === dt.id;
        const isEnabled = dt.enabled;

        // Build the className based on state.
        // Tailwind doesn't allow truly dynamic class names, so we conditionally
        // pick from a fixed set.
        const baseClasses =
          "rounded-xl border p-5 text-left transition flex flex-col gap-2";

        let stateClasses = "";
        if (!isEnabled) {
          stateClasses =
            "border-zinc-800 bg-zinc-900 opacity-50 cursor-not-allowed";
        } else if (isSelected) {
          stateClasses =
            "border-emerald-500 bg-emerald-950 cursor-pointer";
        } else {
          stateClasses =
            "border-zinc-700 bg-zinc-900 hover:border-zinc-500 cursor-pointer";
        }

        return (
          <button
            key={dt.id}
            type="button"
            disabled={!isEnabled}
            onClick={() =>
              isEnabled && onSelect(isSelected ? null : dt.id)
            }
            className={`${baseClasses} ${stateClasses}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold">{dt.label}</span>
              {!isEnabled && (
                <span className="text-xs uppercase tracking-wide text-zinc-500 border border-zinc-700 rounded px-2 py-0.5">
                  Coming soon
                </span>
              )}
            </div>
            <span className="text-sm text-zinc-400">{dt.description}</span>
          </button>
        );
      })}
    </div>
  );
}
