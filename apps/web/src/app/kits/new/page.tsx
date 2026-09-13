"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createKit, ApiError } from "../../../lib/api";
import { ErrorBanner } from "../../../components/ErrorBanner";

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
      router.push(`/kits/${result.runId}/generating`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to start kit generation");
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-semibold text-gray-900">New prep kit</h1>

      {error && (
        <div className="mb-4">
          <ErrorBanner message={error} />
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
          Job description
          <textarea
            required
            rows={10}
            value={jd}
            onChange={(e) => setJd(e.target.value)}
            placeholder="Paste the full job description here..."
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-brand-500"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
          Company website URL
          <input
            type="url"
            required
            value={companyUrl}
            onChange={(e) => setCompanyUrl(e.target.value)}
            placeholder="https://company.com"
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-brand-500"
          />
        </label>

        <label className="flex max-w-[10rem] flex-col gap-1 text-sm font-medium text-gray-700">
          Days available
          <input
            type="number"
            required
            min={1}
            max={60}
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-brand-500"
          />
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 w-fit rounded-md bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
        >
          {submitting ? "Starting..." : "Generate kit"}
        </button>
      </form>
    </main>
  );
}
