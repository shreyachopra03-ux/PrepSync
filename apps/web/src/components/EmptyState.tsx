import { Label } from "./ds";

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  label?: string;
}

export function EmptyState({ title, description, action, label = "Nothing here yet" }: EmptyStateProps) {
  return (
    <div className="bg-gridlines relative overflow-hidden rounded-xl border border-ink/80 bg-[#FBF8F1] px-6 py-16 shadow-[3px_3px_0_0_rgba(15,23,41,0.9)] sm:px-12">
      <div className="relative max-w-md">
        <Label className="text-moss">{label}</Label>
        <p className="mt-3 font-display text-4xl font-medium leading-[1.05] tracking-tight text-ink">{title}</p>
        {description && <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-soft">{description}</p>}
        {action && <div className="mt-7">{action}</div>}
      </div>
      <div aria-hidden="true" className="absolute bottom-6 right-6 hidden items-center gap-2 font-mono text-[0.68rem] text-ink/50 md:flex">
        <span className="rounded border border-ink/30 px-1.5 py-0.5">job description</span>
        <span>+</span>
        <span className="rounded border border-ink/30 px-1.5 py-0.5">url</span>
        <span>→</span>
        <span className="rounded bg-lime px-1.5 py-0.5 text-ink">kit</span>
      </div>
    </div>
  );
}
