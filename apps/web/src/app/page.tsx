"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "../lib/api";
import { LoadingState } from "../components/LoadingState";

export default function HomePage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    getCurrentUser()
      .then(() => router.replace("/dashboard"))
      .catch(() => setChecking(false));
  }, [router]);

  if (checking) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <LoadingState message="Loading..." />
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <h1 className="mb-3 text-3xl font-semibold text-gray-900">PrepSync</h1>
      <p className="mb-8 max-w-md text-gray-600">
        Paste a job description and a company URL. Get a structured, editable, practisable
        interview prep kit.
      </p>
      <div className="flex gap-3">
        <Link
          href="/register"
          className="rounded-md bg-brand-500 px-5 py-2 text-sm font-medium text-white hover:bg-brand-600"
        >
          Get started
        </Link>
        <Link
          href="/login"
          className="rounded-md border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Log in
        </Link>
      </div>
    </main>
  );
}
