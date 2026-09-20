"use client";

import { useEffect, useState } from "react";
import { listKits, ApiError } from "../../lib/api";
import type { KitSummary } from "../../lib/types";
import { KitCard } from "../../components/KitCard";
import { LoadingState } from "../../components/LoadingState";
import { ErrorBanner } from "../../components/ErrorBanner";
import { EmptyState } from "../../components/EmptyState";
import { AppShell, PageHeader, PrimaryLink } from "../../components/ds";

export default function DashboardPage() {
  const [kits, setKits] = useState<KitSummary[] | null>(null);
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
    <AppShell>
      <PageHeader
        label="Your workspace"
        title="Your prep kits"
        description="Every job you are preparing for lives here. Open a kit to study, edit or practise."
        actions={kits !== null && kits.length > 0 ? <PrimaryLink href="/kits/new">New kit</PrimaryLink> : undefined}
      />

      {error && <ErrorBanner message={error} onRetry={load} />}

      {!error && kits === null && <LoadingState message="Loading your kits" />}

      {!error && kits !== null && kits.length === 0 && (
        <EmptyState
          label="Your workspace"
          title="No prep kits yet."
          description="Create your first kit and turn a job description into a focused interview plan."
          action={<PrimaryLink href="/kits/new">Create your first kit</PrimaryLink>}
        />
      )}

      {!error && kits !== null && kits.length > 0 && (
        <div className="grid gap-5 sm:grid-cols-2">
          {kits.map((kit, index) => (
            <KitCard key={kit._id} kit={kit} index={index} />
          ))}
        </div>
      )}
    </AppShell>
  );
}
