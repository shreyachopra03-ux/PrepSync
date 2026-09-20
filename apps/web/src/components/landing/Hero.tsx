import { Label, Mark, PrimaryLink, SecondaryLink } from "./ui";

const card = "absolute rounded-lg border border-ink/80 p-3.5 text-[0.8rem] leading-snug shadow-[4px_4px_0_0_rgba(15,23,41,0.9)]";

function StepDot({ n, className = "" }: { n: number; className?: string }) {
  return (
    <span
      className={`absolute -left-2.5 -top-2.5 flex h-6 w-6 items-center justify-center rounded-full border border-ink bg-paper font-mono text-[0.65rem] font-semibold text-ink ${className}`}
    >
      {n}
    </span>
  );
}

function HeroVisual() {
  return (
    <div aria-hidden="true" className="relative">
      <div className="bg-gridlines relative hidden h-[560px] rounded-xl border border-ink/15 lg:block">
        <span className="absolute left-3 top-2.5 font-mono text-[0.62rem] uppercase tracking-[0.14em] text-ink/40">
          fig. 01 — sample output
        </span>

        <svg viewBox="0 0 520 560" className="pointer-events-none absolute inset-0 h-full w-full" fill="none">
          <defs>
            <marker id="arrow" viewBox="0 0 8 8" refX="6" refY="4" markerWidth="7" markerHeight="7" orient="auto">
              <path d="M1 1l6 3-6 3" stroke="#0F1729" strokeWidth="1.2" fill="none" />
            </marker>
          </defs>
          <g stroke="#0F1729" strokeWidth="1.3" strokeDasharray="4 6" markerEnd="url(#arrow)" className="[&>path]:animate-dash motion-reduce:[&>path]:animate-none">
            <path d="M150 178 C 190 214, 226 214, 262 206" />
            <path d="M392 300 C 380 346, 330 356, 292 358" />
            <path d="M150 466 C 180 508, 232 512, 274 500" />
          </g>
        </svg>

        <div className={`${card} left-6 top-10 w-[15.5rem] -rotate-2 animate-float bg-sky motion-reduce:animate-none`}>
          <StepDot n={1} />
          <Label className="text-ink/60">Role requirements</Label>
          <p className="mt-2 text-ink">
            Build and scale <Mark>REST APIs</Mark> in <Mark>Node.js</Mark>. Own services end to end, with{" "}
            <Mark>PostgreSQL</Mark> experience.
          </p>
        </div>

        <div
          className={`${card} right-5 top-[7.5rem] w-[15rem] rotate-2 animate-float bg-blush motion-reduce:animate-none [animation-delay:-2s]`}
        >
          <StepDot n={2} />
          <Label className="text-ink/60">Company context</Label>
          <p className="mt-2 font-display text-[0.95rem] italic leading-snug text-ink">
            “Small teams, weekly releases, strong ownership.”
          </p>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {["site", "careers", "discussion"].map((source) => (
              <span key={source} className="rounded border border-ink/40 px-1.5 py-0.5 font-mono text-[0.62rem]">
                {source}
              </span>
            ))}
          </div>
        </div>

        <div
          className={`${card} left-4 top-[18.5rem] w-[17rem] -rotate-1 animate-float bg-paper motion-reduce:animate-none [animation-delay:-4s]`}
        >
          <StepDot n={3} />
          <div className="flex items-center justify-between">
            <Label className="text-ink/60">Likely questions</Label>
            <span className="font-mono text-[0.62rem] text-ink/60">technical ●●○</span>
          </div>
          <p className="mt-2 font-medium text-ink">How would you design rate limiting for a public REST API?</p>
          <p className="mt-1.5 text-ink/60">covers: REST APIs · outline included</p>
        </div>

        <div
          className={`${card} bottom-6 right-4 w-[14.5rem] rotate-[1.5deg] animate-float bg-ink text-paper motion-reduce:animate-none [animation-delay:-1s]`}
        >
          <StepDot n={4} />
          <Label className="text-lime">Interview prep</Label>
          <ul className="mt-2 space-y-1.5">
            {[
              ["Day 1", "Node.js & APIs"],
              ["Day 2", "Databases"],
              ["Day 3", "Mock & flashcards"],
            ].map(([day, topic]) => (
              <li key={day} className="flex items-center gap-2">
                <span className="w-9 font-mono text-[0.65rem] text-lime">{day}</span>
                <span className="flex-1 border-b border-dashed border-paper/30 pb-0.5">{topic}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <ol className="space-y-3 lg:hidden">
        {[
          ["Role requirements", "REST APIs · Node.js · PostgreSQL", "bg-sky"],
          ["Company context", "Small teams, weekly releases", "bg-blush"],
          ["Likely questions", "How would you design rate limiting?", "bg-paper"],
          ["Interview prep", "Day 1 · Day 2 · Day 3", "bg-ink text-paper"],
        ].map(([label, text, tone], index) => (
          <li key={label} className="relative">
            <div className={`rounded-lg border border-ink/80 p-3.5 shadow-[3px_3px_0_0_rgba(15,23,41,0.9)] ${tone}`}>
              <Label className="opacity-60">
                {index + 1} · {label}
              </Label>
              <p className="mt-1.5 text-sm">{text}</p>
            </div>
            {index < 3 && <span className="block pl-5 pt-1 font-mono text-ink/50">↓</span>}
          </li>
        ))}
      </ol>
    </div>
  );
}

export function Hero() {
  return (
    <section id="product" className="mx-auto grid max-w-6xl gap-12 px-5 pb-20 pt-12 lg:grid-cols-[1fr_1.05fr] lg:items-center lg:pt-16">
      <div>
        <Label className="inline-flex items-center gap-2 text-ink-soft">
          <span className="h-2 w-2 rounded-full bg-moss" />
          AI interview prep kits
        </Label>
        <h1 className="mt-5 font-display text-[2.6rem] font-medium leading-[1.04] tracking-tight text-ink sm:text-5xl lg:text-[3.3rem] [font-variation-settings:'opsz'_120]">
          Turn a job description
          <br />
          into your interview <Mark>game plan.</Mark>
        </h1>
        <p className="mt-6 max-w-md text-base leading-relaxed text-ink-soft">
          Paste a job description and a company URL. PrepSync researches the company and builds a structured,
          editable prep kit: questions, flashcards and a day-by-day schedule.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <PrimaryLink href="/register">Get started</PrimaryLink>
          <SecondaryLink href="/login">Log in</SecondaryLink>
        </div>
        <p className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[0.72rem] text-ink-soft">
          <span className="rounded border border-ink/30 px-1.5 py-0.5">job description</span>
          <span>+</span>
          <span className="rounded border border-ink/30 px-1.5 py-0.5">company url</span>
          <span>→</span>
          <span className="rounded bg-lime px-1.5 py-0.5 text-ink">prep kit</span>
        </p>
      </div>

      <HeroVisual />
    </section>
  );
}
