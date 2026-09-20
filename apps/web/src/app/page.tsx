"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "../lib/auth-client";
import { LoadingState } from "../components/LoadingState";
import { Navbar } from "../components/landing/Navbar";
import { Hero } from "../components/landing/Hero";
import { HowItWorks } from "../components/landing/HowItWorks";
import { Features } from "../components/landing/Features";
import { FinalCta } from "../components/landing/FinalCta";

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
    <div className="min-h-screen bg-paper font-body text-ink antialiased">
      <Navbar />
      <main>
        <Hero />
        <HowItWorks />
        <Features />
      </main>
      <FinalCta />
    </div>
  );
}
