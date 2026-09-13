"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getRun, ApiError } from "../../../../lib/api";
import type { Run } from "../../../../lib/types";
import { LoadingState } from "../../../../components/LoadingState";
import { ErrorBanner } from "../../../../components/ErrorBanner";

const POLL_INTERVAL_MS = 2000;

const STEP_LABELS: Record<string, string> = {
  extractRole: "Reading job description",
  crawlCompany: "Exploring company website",
  findHiringPage: "Looking for hiring page",
  searchPublicDiscussion: "Searching public discussion",
  buildCompanyBrief: "Writing company brief",
  generateQuestions: "Generating interview questions",
  coverageLoop: "Checking requirement coverage",
  generateFlashcards: "Generating flashcards",
  buildSchedule: "Building your study schedule",
  validateKit: "Final checks",
};

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
          router.push(`/kits/${latest.kitId}`);
          return;
        }

        if (latest.status === "failed") {
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

  return (
    <main className="mx-auto max-w-lg px-4 py-16">
      <h1 className="mb-6 text-center text-2xl font-semibold text-gray-900">
        Generating your prep kit
      </h1>

      {error && <ErrorBanner message={error} />}

      {!error && !run && <LoadingState message="Starting..." />}

      {!error && run && (
        <ul className="flex flex-col gap-2">
          {run.steps.length === 0 && <LoadingState message="Starting..." />}
          {run.steps.map((step) => (
            <li
              key={step.name}
              className="flex items-center justify-between rounded-md border border-gray-200 bg-white px-4 py-2 text-sm"
            >
              <span className="text-gray-700">{STEP_LABELS[step.name] ?? step.name}</span>
              <span
                className={
                  step.status === "done"
                    ? "text-green-600"
                    : step.status === "failed"
                      ? "text-red-600"
                      : "text-gray-400"
                }
              >
                {step.status === "done" ? "Done" : step.status === "failed" ? "Failed" : "Working..."}
              </span>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
