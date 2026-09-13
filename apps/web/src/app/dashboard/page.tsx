"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { listKits, ApiError } from "../../lib/api";
import type { Kit } from "../../lib/types";
import { KitCard } from "../../components/KitCard";
import { LoadingState } from "../../components/LoadingState";
import { ErrorBanner } from "../../components/ErrorBanner";
import { EmptyState } from "../../components/EmptyState";

export default function DashboardPage() {
  const [kits, setKits] = useState<Kit[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setError(null);
    try {
      const result = await listKits();
      setKits(result.kits);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load your kits");
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Your prep kits</h1>
        <Link
          href="/kits/new"
          className="rounded-md bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 focus-visible:outline-2 focus-visible:outline-brand-700"
        >
          New kit
        </Link>
      </div>

      {error && <ErrorBanner message={error} onRetry={load} />}

      {!error && kits === null && <LoadingState message="Loading your kits..." />}

      {!error && kits !== null && kits.length === 0 && (
        <EmptyState
          title="No kits yet"
          description="Paste a job description and a company URL to generate your first prep kit."
          action={
            <Link
              href="/kits/new"
              className="rounded-md bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
            >
              Create your first kit
            </Link>
          }
        />
      )}

      {!error && kits !== null && kits.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {kits.map((kit) => (
            <KitCard key={kit._id} kit={kit} />
          ))}
        </div>
      )}
    </main>
  );
}
