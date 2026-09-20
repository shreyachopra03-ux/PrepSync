import { Label } from "./ui";
import { Reveal } from "./Reveal";

const tile = "rounded-xl border border-ink/80 p-6 transition-transform duration-200 hover:-translate-y-0.5";

export function Features() {
  return (
    <section id="features" className="border-t border-ink/15 bg-paper-deep/60">
      <div className="mx-auto max-w-6xl px-5 py-20">
        <Reveal className="grid gap-6 lg:grid-cols-[1fr_1.4fr] lg:items-end">
          <div>
            <Label className="text-moss">Features</Label>
            <h2 className="mt-4 font-display text-4xl font-medium leading-[1.08] tracking-tight text-ink sm:text-5xl">
              A kit that is yours to shape.
            </h2>
          </div>
          <p className="max-w-lg text-[0.95rem] leading-relaxed text-ink-soft lg:justify-self-end">
            Generated first drafts are only the start. Rewrite, reorder and pin. Regenerate the rest without losing
            what you kept.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-4 md:grid-cols-12">
          <Reveal className="md:col-span-7">
            <div className={`${tile} h-full bg-lime`}>
              <Label className="text-ink/60">Coverage</Label>
              <h3 className="mt-3 font-display text-2xl leading-snug tracking-tight text-ink">
                Every requirement, covered.
              </h3>
              <p className="mt-2 max-w-sm text-[0.92rem] leading-relaxed text-ink-soft">
                A coverage check maps questions back to the role and fills the gaps automatically.
              </p>
              <ul className="mt-5 grid gap-2 font-mono text-[0.72rem] text-ink sm:grid-cols-2">
                {["REST APIs", "PostgreSQL", "Node.js", "System design"].map((requirement) => (
                  <li key={requirement} className="flex items-center gap-2 rounded border border-ink/60 bg-paper px-2.5 py-1.5">
                    <span className="text-moss">✓</span>
                    {requirement}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          <Reveal className="md:col-span-5" delay={80}>
            <div className={`${tile} h-full bg-sky`}>
              <Label className="text-ink/60">Editing</Label>
              <h3 className="mt-3 font-display text-2xl leading-snug tracking-tight text-ink">
                Edit, pin, regenerate.
              </h3>
              <p className="mt-2 text-[0.92rem] leading-relaxed text-ink-soft">
                Pinned and edited questions stay put when you regenerate a section.
              </p>
              <div className="mt-5 flex items-center gap-2 rounded-md border border-ink/60 bg-paper px-3 py-2 text-[0.8rem] text-ink">
                <span aria-hidden="true">📌</span>
                <span className="flex-1">Explain your caching strategy</span>
                <span className="font-mono text-[0.65rem] text-ink/50">pinned</span>
              </div>
            </div>
          </Reveal>

          <Reveal className="md:col-span-5" delay={80}>
            <div className={`${tile} h-full bg-blush`}>
              <Label className="text-ink/60">Schedule</Label>
              <h3 className="mt-3 font-display text-2xl leading-snug tracking-tight text-ink">
                Fits the days you have.
              </h3>
              <p className="mt-2 text-[0.92rem] leading-relaxed text-ink-soft">
                Choose how many days until the interview. Study time is spread across them.
              </p>
              <div className="mt-5 flex gap-1.5">
                {[1, 2, 3, 4, 5].map((day) => (
                  <span
                    key={day}
                    className={`flex h-9 flex-1 items-center justify-center rounded border border-ink/60 font-mono text-[0.7rem] ${
                      day <= 3 ? "bg-ink text-paper" : "bg-paper text-ink"
                    }`}
                  >
                    D{day}
                  </span>
                ))}
              </div>
            </div>
          </Reveal>

          <Reveal className="md:col-span-7" delay={160}>
            <div className={`${tile} h-full bg-paper`}>
              <Label className="text-ink/60">Practice</Label>
              <h3 className="mt-3 font-display text-2xl leading-snug tracking-tight text-ink">
                Flashcards you actually revisit.
              </h3>
              <p className="mt-2 max-w-sm text-[0.92rem] leading-relaxed text-ink-soft">
                Rate how confident you feel after each card. PrepSync brings back the ones you are least sure about.
              </p>
              <div className="mt-5 flex items-center gap-2 font-mono text-[0.72rem]">
                <span className="text-ink/60">confidence</span>
                {[1, 2, 3].map((level) => (
                  <span
                    key={level}
                    className="flex h-8 w-8 items-center justify-center rounded border border-ink/70 bg-paper-deep text-ink"
                  >
                    {level}
                  </span>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
