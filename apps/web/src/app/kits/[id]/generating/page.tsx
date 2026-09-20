"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getRun, ApiError } from "../../../../lib/api";
import type { Run, RunStep } from "../../../../lib/types";
import { ErrorBanner } from "../../../../components/ErrorBanner";
import { track } from "../../../../lib/analytics";
import { AppShell, Label, PageHeader, SecondaryLink, Spinner } from "../../../../components/ds";

const POLL_INTERVAL_MS = 2000;

const PIPELINE: { name: string; label: string; tag: string }[] = [
  { name: "extractRole", label: "Reading job description", tag: "Role analysis" },
  { name: "crawlCompany", label: "Exploring company website", tag: "Company research" },
  { name: "findHiringPage", label: "Looking for hiring page", tag: "Hiring signals" },
  { name: "searchPublicDiscussion", label: "Searching public discussion", tag: "Public signals" },
  { name: "buildCompanyBrief", label: "Writing company brief", tag: "Company context" },
  { name: "generateQuestions", label: "Generating interview questions", tag: "Question generation" },
  { name: "coverageLoop", label: "Checking requirement coverage", tag: "Coverage check" },
  { name: "generateFlashcards", label: "Generating flashcards", tag: "Flashcards" },
  { name: "buildSchedule", label: "Building your study schedule", tag: "Study plan" },
  { name: "validateKit", label: "Final checks", tag: "Validation" },
];

type StepState = "done" | "active" | "failed" | "pending";

function stateOf(step: RunStep | undefined): StepState {
  if (!step) return "pending";
  if (step.status === "done") return "done";
  if (step.status === "failed") return "failed";
  return "active";
}

function StepNode({ state }: { state: StepState }) {
  if (state === "done") {
    return (
      <span className="flex h-7 w-7 items-center justify-center rounded-full border border-ink bg-lime text-xs text-ink">
        ✓
      </span>
    );
  }
  if (state === "failed") {
    return (
      <span className="flex h-7 w-7 items-center justify-center rounded-full border border-[#8A2626] bg-[#FCE9E2] text-xs text-[#8A2626]">
        ×
      </span>
    );
  }
  if (state === "active") {
    return (
      <span className="relative flex h-7 w-7 items-center justify-center rounded-full border border-ink bg-paper">
        <span className="absolute inset-0 animate-ping rounded-full bg-lime/70 motion-reduce:animate-none" />
        <Spinner className="relative h-3.5 w-3.5" />
      </span>
    );
  }
  return <span className="h-7 w-7 rounded-full border border-dashed border-ink/30 bg-paper" />;
}

export default function GeneratingPage({ params }: { params: { id: string } }) {
  const runId = params.id;
  const router = useRouter();
  const [run, setRun] = useState<Run | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const latest = await getRun(runId);
        if (cancelled) return;

        setRun(latest);

        if (latest.status === "done" && latest.kitId) {
          track("kit_generation_succeeded");
          router.push(`/kits/${latest.kitId}`);
          return;
        }

        if (latest.status === "failed") {
          track("kit_generation_failed");
          setError(latest.error ?? "Kit generation failed");
          return;
        }

        setTimeout(poll, POLL_INTERVAL_MS);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "Failed to check generation status");
        }
      }
    }

    poll();
    return () => {
      cancelled = true;
    };
  }, [runId, router]);

  const stepsByName = new Map((run?.steps ?? []).map((step) => [step.name, step]));
  const doneCount = PIPELINE.filter((item) => stateOf(stepsByName.get(item.name)) === "done").length;

  return (
    <AppShell width="max-w-3xl">
      <PageHeader
        label="PrepSync research pipeline"
        title="Building your prep kit."
        description="Reading the role, researching the company, and turning both into a focused interview plan."
      />

      {error && (
        <div className="mb-8 flex flex-col items-start gap-4">
          <ErrorBanner message={error} />
          <SecondaryLink href="/kits/new">Start over</SecondaryLink>
        </div>
      )}

      <div className="mb-6 flex items-center justify-between">
        <Label className="text-ink-soft">Progress</Label>
        <Label className="text-ink-soft">
          {doneCount} of {PIPELINE.length} steps
        </Label>
      </div>
      <div className="mb-10 h-1.5 overflow-hidden rounded-full bg-ink/10">
        <div
          className="h-full rounded-full bg-ink transition-all duration-500"
          style={{ width: `${(doneCount / PIPELINE.length) * 100}%` }}
        />
      </div>

      <ol className="relative">
        {PIPELINE.map((item, index) => {
          const state = stateOf(stepsByName.get(item.name));
          const isLast = index === PIPELINE.length - 1;

          return (
            <li key={item.name} className="relative flex gap-5 pb-7 last:pb-0">
              {!isLast && (
                <span
                  aria-hidden="true"
                  className={`absolute left-[13px] top-7 h-[calc(100%-1.75rem)] w-px ${
                    state === "done" ? "bg-ink" : "border-l border-dashed border-ink/30"
                  }`}
                />
              )}
              <StepNode state={state} />
              <div className={`flex-1 transition-opacity duration-300 ${state === "pending" ? "opacity-45" : ""}`}>
                <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                  <p className="flex items-baseline gap-3">
                    <span className="font-mono text-[0.68rem] text-ink/45">{String(index + 1).padStart(2, "0")}</span>
                    <span
                      className={`font-display text-xl leading-tight tracking-tight ${
                        state === "active" ? "font-semibold" : "font-medium"
                      }`}
                    >
                      {item.label}
                    </span>
                  </p>
                  <span className="font-mono text-[0.65rem] uppercase tracking-[0.14em] text-ink-soft">
                    {state === "done" && "Done"}
                    {state === "active" && "Working..."}
                    {state === "failed" && "Failed"}
                  </span>
                </div>
                <Label className="ml-[2.1rem] text-ink/45">{item.tag}</Label>
              </div>
            </li>
          );
        })}
      </ol>
    </AppShell>
  );
}
