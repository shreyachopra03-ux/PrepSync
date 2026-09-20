import Link from "next/link";
import { Wordmark } from "./Wordmark";
import { Reveal } from "./Reveal";
import { Label, PrimaryLink } from "./ui";

export function FinalCta() {
  return (
    <>
      <section className="bg-ink text-paper">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <Reveal className="grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-end">
            <h2 className="font-display text-4xl font-medium leading-[1.06] tracking-tight sm:text-5xl lg:text-6xl">
              Your next interview
              <br />
              starts with a <em className="italic text-lime">plan.</em>
            </h2>
            <div>
              <p className="max-w-sm text-[0.95rem] leading-relaxed text-paper/70">
                Bring a job description and a company URL. Leave with a kit you can study from tonight.
              </p>
              <div className="mt-6">
                <PrimaryLink href="/register" onDark>
                  Get started
                </PrimaryLink>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <footer className="border-t border-paper/15 bg-ink text-paper">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-6">
          <Wordmark className="text-paper" />
          <div className="flex items-center gap-6">
            <Link href="/login" className="text-sm text-paper/70 underline-offset-4 hover:text-paper hover:underline">
              Log in
            </Link>
            <Link href="/register" className="text-sm text-paper/70 underline-offset-4 hover:text-paper hover:underline">
              Get started
            </Link>
            <Label className="text-paper/40">© 2026 PrepSync</Label>
          </div>
        </div>
      </footer>
    </>
  );
}
