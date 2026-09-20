import Link from "next/link";
import type { ReactNode } from "react";

const primary =
  "group inline-flex items-center gap-2 rounded-md bg-ink px-4 py-2.5 text-sm font-medium text-paper ring-1 ring-ink shadow-[3px_3px_0_0_#E4F169] transition duration-150 hover:-translate-x-px hover:-translate-y-px hover:shadow-[5px_5px_0_0_#E4F169]";
const primaryOnDark =
  "group inline-flex items-center gap-2 rounded-md bg-lime px-5 py-3 text-sm font-semibold text-ink shadow-[3px_3px_0_0_#F5F0E6] transition duration-150 hover:-translate-x-px hover:-translate-y-px hover:shadow-[5px_5px_0_0_#F5F0E6]";
const secondary =
  "inline-flex items-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium text-ink ring-1 ring-ink/30 transition duration-150 hover:bg-ink/5 hover:ring-ink";

function Arrow() {
  return (
    <span aria-hidden="true" className="transition-transform duration-150 group-hover:translate-x-0.5">
      →
    </span>
  );
}

export function PrimaryLink({
  href,
  children,
  onDark = false,
}: {
  href: string;
  children: ReactNode;
  onDark?: boolean;
}) {
  return (
    <Link href={href} className={onDark ? primaryOnDark : primary}>
      {children}
      <Arrow />
    </Link>
  );
}

export function SecondaryLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className={secondary}>
      {children}
    </Link>
  );
}

export function Mark({ children }: { children: ReactNode }) {
  return (
    <span className="whitespace-nowrap bg-[linear-gradient(transparent_62%,#E4F169_62%,#E4F169_92%,transparent_92%)] px-0.5">
      {children}
    </span>
  );
}

export function Label({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span className={`font-mono text-[0.68rem] font-medium uppercase tracking-[0.14em] ${className}`}>
      {children}
    </span>
  );
}
