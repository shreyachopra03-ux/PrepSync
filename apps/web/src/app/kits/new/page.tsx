"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createKit, ApiError } from "../../../lib/api";
import { ErrorBanner } from "../../../components/ErrorBanner";
import { track } from "../../../lib/analytics";
import { AppShell, Card, Field, Label, PageHeader, PrimaryButton, inputClass } from "../../../components/ds";

const QUICK_DAYS = [1, 2, 3, 5, 7, 10, 14];

export default function NewKitPage() {
  const router = useRouter();
  const [jd, setJd] = useState("");
  const [companyUrl, setCompanyUrl] = useState("");
  const [days, setDays] = useState(5);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const result = await createKit({ jd, company_url: companyUrl, days });
      track("kit_generation_started", { days });
      router.push(`/kits/${result.runId}/generating`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to start kit generation");
      setSubmitting(false);
    }
  }

  return (
    <AppShell width="max-w-5xl">
      <PageHeader
        label="Create a prep kit"
        title="Start with the role."
        description="Give PrepSync the job description and the company website. It does the research and builds the kit."
      />

      {error && (
        <div className="mb-6">
          <ErrorBanner message={error} />
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[1fr_17rem] lg:items-start">
        <form onSubmit={handleSubmit}>
          <Card className="flex flex-col gap-7 p-6 sm:p-8">
            <Field
              index="01"
              label="Job description"
              htmlFor="jd"
              hint="Paste the full job description. PrepSync will identify the requirements worth preparing for."
            >
              <textarea
                id="jd"
                required
                rows={12}
                value={jd}
                onChange={(e) => setJd(e.target.value)}
                placeholder="Paste the full job description here..."
                className={`${inputClass} leading-relaxed`}
              />
            </Field>

            <Field
              index="02"
              label="Company website"
              htmlFor="company-url"
              hint="PrepSync reads the site and its careers page to understand how the company works."
            >
              <input
                id="company-url"
                type="url"
                required
                value={companyUrl}
                onChange={(e) => setCompanyUrl(e.target.value)}
                placeholder="https://company.com"
                className={`${inputClass} font-mono`}
              />
            </Field>

            <Field index="03" label="How many days do you have?" hint="Study time is spread across these days.">
              <div className="flex flex-wrap items-center gap-2">
                {QUICK_DAYS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    aria-pressed={days === option}
                    onClick={() => setDays(option)}
                    className={`h-10 min-w-[2.75rem] rounded-md border px-3 font-mono text-sm transition duration-150 ${
                      days === option
                        ? "border-ink bg-lime text-ink shadow-[2px_2px_0_0_#0F1729]"
                        : "border-ink/40 bg-[#FBF8F1] text-ink hover:border-ink"
                    }`}
                  >
                    {option}
                  </button>
                ))}
                <label className="ml-1 flex items-center gap-2 text-xs text-ink-soft">
                  or
                  <input
                    type="number"
                    required
                    min={1}
                    max={60}
                    value={days}
                    onChange={(e) => setDays(Number(e.target.value))}
                    aria-label="Days available"
                    className={`${inputClass} !h-10 !w-20 font-mono`}
                  />
                </label>
              </div>
            </Field>

            <div className="border-t border-dashed border-ink/25 pt-6">
              <PrimaryButton type="submit" disabled={submitting} arrow={!submitting}>
                {submitting ? "Starting..." : "Build my prep kit"}
              </PrimaryButton>
            </div>
          </Card>
        </form>

        <aside className="lg:sticky lg:top-8">
          <Card tone="sky" className="p-5">
            <Label className="text-ink/60">What you get</Label>
            <ul className="mt-4 space-y-3 text-sm text-ink">
              {[
                "Questions for every requirement",
                "Answer outlines to check yourself",
                "Flashcards you can practise",
                "A day-by-day study schedule",
              ].map((item) => (
                <li key={item} className="flex gap-2.5 leading-snug">
                  <span aria-hidden="true" className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-ink bg-lime text-[0.6rem]">
                    ✓
                  </span>
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-5 border-t border-dashed border-ink/30 pt-4 font-mono text-[0.68rem] leading-relaxed text-ink/60">
              Takes a minute or two. You can watch each step as it happens.
            </p>
          </Card>
        </aside>
      </div>
    </AppShell>
  );
}
