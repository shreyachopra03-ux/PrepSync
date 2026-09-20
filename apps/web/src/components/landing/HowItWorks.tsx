import type { ReactNode } from "react";
import { Label, Mark } from "./ui";
import { Reveal } from "./Reveal";

interface Step {
  n: string;
  label: string;
  title: string;
  body: string;
  tone: string;
  preview: ReactNode;
}

function Chip({ children, tone = "" }: { children: ReactNode; tone?: string }) {
  return (
    <span className={`rounded border border-ink/50 px-1.5 py-0.5 font-mono text-[0.65rem] ${tone}`}>{children}</span>
  );
}

const STEPS: Step[] = [
  {
    n: "01",
    label: "Paste the role",
    title: "We read the posting like a hiring manager.",
    body: "Drop in the job description. PrepSync pulls out every requirement and ranks what is essential versus nice to have.",
    tone: "bg-sky",
    preview: (
      <div className="space-y-3">
        <div className="rounded-md border border-ink/70 bg-paper p-3 text-[0.8rem] leading-relaxed text-ink">
          <Label className="text-ink/50">job description</Label>
          <p className="mt-2">
            You will design <Mark>REST APIs</Mark>, work with <Mark>PostgreSQL</Mark> and ship{" "}
            <Mark>Node.js</Mark> services. Experience with queues is a plus.
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Chip tone="bg-lime">must · REST APIs</Chip>
          <Chip tone="bg-lime">must · PostgreSQL</Chip>
          <Chip tone="bg-lime">must · Node.js</Chip>
          <Chip>nice · queues</Chip>
        </div>
      </div>
    ),
  },
  {
    n: "02",
    label: "Understand the company",
    title: "Then we go and do the research.",
    body: "PrepSync reads the company website and careers page, and looks at public discussion, so questions reflect how they actually work.",
    tone: "bg-blush",
    preview: (
      <ul className="space-y-2 text-[0.8rem] text-ink">
        {[
          ["company site", "What they build and who for"],
          ["careers page", "How they describe the role"],
          ["public discussion", "What candidates say about hiring"],
        ].map(([source, note]) => (
          <li key={source} className="flex items-center gap-3 rounded-md border border-ink/70 bg-paper px-3 py-2">
            <Chip>{source}</Chip>
            <span>{note}</span>
          </li>
        ))}
        <li className="pl-1 font-display italic text-ink-soft">→ a short company brief, written for you</li>
      </ul>
    ),
  },
  {
    n: "03",
    label: "Build the questions",
    title: "Every requirement gets at least one question.",
    body: "Questions come with answer outlines and difficulty. A coverage check makes sure no requirement is left without one.",
    tone: "bg-paper-deep",
    preview: (
      <div className="rounded-md border border-ink/70 bg-paper p-3.5 text-[0.8rem] text-ink">
        <div className="flex items-center justify-between">
          <Chip tone="bg-sky">technical</Chip>
          <span className="font-mono text-[0.65rem] text-ink/60">difficulty ●●○</span>
        </div>
        <p className="mt-2.5 font-display text-base leading-snug">
          How would you design rate limiting for a public REST API?
        </p>
        <ul className="mt-2.5 space-y-1 border-t border-dashed border-ink/30 pt-2.5 text-ink-soft">
          <li>— Pick a strategy: token bucket or sliding window</li>
          <li>— Where the state lives, and why</li>
          <li>— What clients see when they are limited</li>
        </ul>
        <p className="mt-2.5 font-mono text-[0.65rem] text-moss">✓ covers: REST APIs</p>
      </div>
    ),
  },
  {
    n: "04",
    label: "Prepare",
    title: "A plan you can follow, and practise.",
    body: "Get a day-by-day schedule and flashcards. Edit anything, pin what matters, and rate your confidence as you practise.",
    tone: "bg-ink text-paper",
    preview: (
      <div className="space-y-3">
        <ul className="space-y-2 text-[0.8rem]">
          {[
            ["Day 1", "Node.js & APIs", "w-3/4"],
            ["Day 2", "Databases", "w-1/2"],
            ["Day 3", "Mock & flashcards", "w-1/4"],
          ].map(([day, topic, width]) => (
            <li key={day}>
              <div className="flex justify-between">
                <span>{topic}</span>
                <span className="font-mono text-[0.65rem] text-lime">{day}</span>
              </div>
              <div className="mt-1 h-1.5 rounded-full bg-paper/20">
                <div className={`h-full rounded-full bg-lime ${width}`} />
              </div>
            </li>
          ))}
        </ul>
        <div className="rounded-md border border-paper/40 p-3 text-[0.8rem]">
          <Label className="text-lime">flashcard</Label>
          <p className="mt-1.5">What is the difference between a token bucket and a sliding window?</p>
          <p className="mt-2 font-mono text-[0.65rem] text-paper/60">rate your confidence · 1 2 3</p>
        </div>
      </div>
    ),
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="border-t border-ink/15">
      <div className="mx-auto max-w-6xl px-5 py-20">
        <Reveal className="max-w-2xl">
          <Label className="text-moss">How it works</Label>
          <h2 className="mt-4 font-display text-4xl font-medium leading-[1.08] tracking-tight text-ink sm:text-5xl">
            From a posting to prepared, in four steps.
          </h2>
        </Reveal>

        <div className="mt-14">
          {STEPS.map((step) => (
            <Reveal key={step.n}>
              <article className="grid gap-6 border-t border-ink/15 py-10 lg:grid-cols-[6rem_1fr_1.1fr] lg:gap-10">
                <span className="font-display text-6xl leading-none text-transparent [-webkit-text-stroke:1.2px_#0F1729] lg:text-7xl">
                  {step.n}
                </span>
                <div className="max-w-md">
                  <Label className="text-ink-soft">{step.label}</Label>
                  <h3 className="mt-3 font-display text-2xl font-medium leading-snug tracking-tight text-ink sm:text-[1.75rem]">
                    {step.title}
                  </h3>
                  <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-soft">{step.body}</p>
                </div>
                <div
                  className={`bg-gridlines rounded-xl border border-ink/80 p-5 shadow-[4px_4px_0_0_rgba(15,23,41,0.9)] transition-transform duration-200 hover:-translate-y-0.5 ${step.tone}`}
                >
                  {step.preview}
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
