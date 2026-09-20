"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { authClient } from "../../lib/auth-client";
import { resetIdentity, track } from "../../lib/analytics";
import { Wordmark } from "../landing/Wordmark";
import {
  btnPrimary,
  btnPrimaryOnDark,
  btnSecondary,
  cardBase,
  cardInteractive,
  cardTones,
  type CardTone,
} from "./styles";

export {
  btnPrimary,
  btnSecondary,
  btnSmall,
  btnSmallDanger,
  btnSmallPrimary,
  inputClass,
} from "./styles";

function Arrow() {
  return (
    <span aria-hidden="true" className="transition-transform duration-150 group-hover:translate-x-0.5">
      →
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
    <Link href={href} className={onDark ? btnPrimaryOnDark : btnPrimary}>
      {children}
      <Arrow />
    </Link>
  );
}

export function SecondaryLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className={btnSecondary}>
      {children}
    </Link>
  );
}

export function PrimaryButton({
  children,
  arrow = true,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { arrow?: boolean }) {
  return (
    <button {...props} className={`${btnPrimary} ${className}`}>
      {children}
      {arrow && <Arrow />}
    </button>
  );
}

export function SecondaryButton({ children, className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...props} className={`${btnSecondary} ${className}`}>
      {children}
    </button>
  );
}

export function Card({
  tone = "paper",
  interactive = false,
  className = "",
  children,
}: {
  tone?: CardTone;
  interactive?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`${cardBase} ${cardTones[tone]} ${interactive ? cardInteractive : ""} ${className}`}>
      {children}
    </div>
  );
}

const badgeTones = {
  neutral: "border-ink/40 text-ink-soft",
  lime: "border-ink/60 bg-lime text-ink",
  sky: "border-ink/60 bg-sky text-ink",
  blush: "border-ink/60 bg-blush text-ink",
  ink: "border-ink bg-ink text-paper",
} as const;

export function StatusBadge({
  tone = "neutral",
  children,
}: {
  tone?: keyof typeof badgeTones;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center rounded border px-1.5 py-0.5 font-mono text-[0.65rem] leading-none ${badgeTones[tone]}`}
    >
      {children}
    </span>
  );
}

export function PageHeader({
  label,
  title,
  description,
  actions,
}: {
  label: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-10 flex flex-wrap items-end justify-between gap-6 border-b border-ink/15 pb-8">
      <div className="max-w-2xl">
        <Label className="text-moss">{label}</Label>
        <h1 className="mt-3 font-display text-4xl font-medium leading-[1.06] tracking-tight text-ink sm:text-[2.75rem] [font-variation-settings:'opsz'_120]">
          {title}
        </h1>
        {description && <p className="mt-3 max-w-xl text-[0.95rem] leading-relaxed text-ink-soft">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </div>
  );
}

export function SectionHeader({
  n,
  label,
  title,
  action,
}: {
  n: string;
  label: string;
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="flex items-end gap-4">
        <span className="font-display text-5xl leading-none text-transparent [-webkit-text-stroke:1.2px_#0F1729]">
          {n}
        </span>
        <div className="pb-0.5">
          <Label className="text-ink-soft">{label}</Label>
          <h2 className="mt-1 font-display text-2xl font-medium leading-tight tracking-tight text-ink">{title}</h2>
        </div>
      </div>
      {action}
    </div>
  );
}

export function Field({
  label,
  hint,
  htmlFor,
  index,
  children,
}: {
  label: string;
  hint?: string;
  htmlFor?: string;
  index?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={htmlFor} className="flex items-center gap-2 text-sm font-medium text-ink">
        {index && <Label className="text-ink/45">{index}</Label>}
        {label}
      </label>
      {children}
      {hint && <p className="text-xs leading-relaxed text-ink-soft">{hint}</p>}
    </div>
  );
}

export function Spinner({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block h-4 w-4 animate-spin rounded-full border-2 border-ink/20 border-t-ink ${className}`}
    />
  );
}

export function AppHeader() {
  const router = useRouter();
  const { data: session } = authClient.useSession();

  async function handleLogout() {
    track("logout_clicked");
    await authClient.signOut();
    resetIdentity();
    router.push("/login");
  }

  return (
    <header className="border-b border-ink/15">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-5">
        <div className="flex items-center gap-8">
          <Link href="/dashboard" aria-label="PrepSync dashboard" className="text-ink">
            <Wordmark />
          </Link>
          <nav aria-label="Workspace" className="hidden items-center gap-6 sm:flex">
            {[
              { href: "/dashboard", label: "Kits" },
              { href: "/kits/new", label: "New kit" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="group relative py-1 text-sm text-ink-soft transition-colors hover:text-ink"
              >
                {link.label}
                <span className="absolute inset-x-0 -bottom-0.5 h-px origin-left scale-x-0 bg-ink transition-transform duration-200 group-hover:scale-x-100" />
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          {session?.user.email && (
            <span className="hidden max-w-[14rem] truncate font-mono text-[0.7rem] text-ink-soft md:inline">
              {session.user.email}
            </span>
          )}
          <button type="button" onClick={handleLogout} className={`${btnSecondary} !px-3 !py-1.5`}>
            Log out
          </button>
        </div>
      </div>
    </header>
  );
}

export function AppShell({
  children,
  width = "max-w-5xl",
}: {
  children: ReactNode;
  width?: string;
}) {
  return (
    <div className="min-h-screen bg-paper font-body text-ink antialiased">
      <AppHeader />
      <main className={`mx-auto w-full px-5 py-12 ${width}`}>{children}</main>
    </div>
  );
}

export function AuthShell({
  label,
  title,
  description,
  switchPrompt,
  switchLabel,
  switchHref,
  children,
}: {
  label: string;
  title: ReactNode;
  description: string;
  switchPrompt: string;
  switchLabel: string;
  switchHref: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-paper font-body text-ink antialiased">
      <header className="border-b border-ink/15">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Link href="/" aria-label="PrepSync home" className="text-ink">
            <Wordmark />
          </Link>
          <p className="text-sm text-ink-soft">
            {switchPrompt}{" "}
            <Link href={switchHref} className="font-medium text-ink underline underline-offset-4">
              {switchLabel}
            </Link>
          </p>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-12 px-5 py-12 lg:grid-cols-[1fr_28rem] lg:items-center lg:gap-20 lg:py-20">
        <div>
          <Label className="inline-flex items-center gap-2 text-ink-soft">
            <span className="h-2 w-2 rounded-full bg-moss" />
            {label}
          </Label>
          <h1 className="mt-5 font-display text-[2.4rem] font-medium leading-[1.05] tracking-tight text-ink sm:text-5xl [font-variation-settings:'opsz'_120]">
            {title}
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-ink-soft">{description}</p>

          <ol className="mt-10 hidden max-w-sm space-y-4 lg:block">
            {[
              ["01", "Paste the role", "We pull out every requirement."],
              ["02", "We research the company", "Site, careers page and public chatter."],
              ["03", "You practise", "Questions, flashcards and a schedule."],
            ].map(([n, heading, body]) => (
              <li key={n} className="flex gap-4 border-t border-ink/15 pt-4">
                <span className="font-mono text-xs text-ink/45">{n}</span>
                <div>
                  <p className="font-display text-lg leading-tight text-ink">{heading}</p>
                  <p className="mt-0.5 text-sm text-ink-soft">{body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className={`${cardBase} bg-[#FBF8F1] p-6 sm:p-7`}>{children}</div>
      </main>
    </div>
  );
}

export function FormDivider() {
  return (
    <div className="my-5 flex items-center gap-3">
      <span className="h-px flex-1 bg-ink/15" />
      <Label className="text-ink/45">or</Label>
      <span className="h-px flex-1 bg-ink/15" />
    </div>
  );
}

export function GoogleMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 48 48" className="h-4 w-4">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}
