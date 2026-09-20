"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "../lib/auth-client";
import { LoadingState } from "../components/LoadingState";
import { BackgroundBeams } from "../components/background-beams";

export default function HomePage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (session) router.replace("/dashboard");
  }, [session, router]);

  if (isPending || session) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <LoadingState message="Loading..." />
      </main>
    );
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-neutral-950 px-4 text-center">
      <BackgroundBeams />
      <div className="relative z-10 flex flex-col items-center">
        <h1 className="mb-3 text-3xl font-semibold text-white">PrepSync</h1>
        <p className="mb-8 max-w-md text-neutral-300">
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
            className="rounded-md border border-neutral-600 px-5 py-2 text-sm font-medium text-neutral-200 hover:bg-neutral-800"
          >
            Log in
          </Link>
        </div>
      </div>
    </main>
  );
}
