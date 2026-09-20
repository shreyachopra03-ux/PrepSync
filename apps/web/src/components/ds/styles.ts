const btnBase =
  "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition duration-150 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-x-0 disabled:hover:translate-y-0";

export const btnPrimary = `group ${btnBase} bg-ink px-4 py-2.5 text-paper ring-1 ring-ink shadow-[3px_3px_0_0_#E4F169] hover:-translate-x-px hover:-translate-y-px hover:shadow-[5px_5px_0_0_#E4F169]`;

export const btnPrimaryOnDark = `group ${btnBase} bg-lime px-5 py-3 font-semibold text-ink shadow-[3px_3px_0_0_#F5F0E6] hover:-translate-x-px hover:-translate-y-px hover:shadow-[5px_5px_0_0_#F5F0E6]`;

export const btnSecondary = `${btnBase} px-4 py-2.5 text-ink ring-1 ring-ink/30 hover:bg-ink/5 hover:ring-ink`;

export const btnSmall =
  "inline-flex items-center justify-center rounded-md px-2.5 py-1 text-xs font-medium text-ink ring-1 ring-ink/30 transition duration-150 hover:bg-ink/5 hover:ring-ink disabled:cursor-not-allowed disabled:opacity-50";

export const btnSmallDanger =
  "inline-flex items-center justify-center rounded-md px-2.5 py-1 text-xs font-medium text-[#8A2626] ring-1 ring-[#8A2626]/35 transition duration-150 hover:bg-[#8A2626]/5 hover:ring-[#8A2626] disabled:opacity-50";

export const btnSmallPrimary =
  "inline-flex items-center justify-center rounded-md bg-ink px-3 py-1 text-xs font-medium text-paper ring-1 ring-ink transition duration-150 hover:bg-ink-soft disabled:opacity-50";

export const inputClass =
  "w-full rounded-md border border-ink/40 bg-[#FBF8F1] px-3 py-2 text-sm text-ink placeholder:text-ink/40 transition duration-150 hover:border-ink/70 focus:border-ink focus:outline-none focus:ring-2 focus:ring-lime";

export const cardBase =
  "rounded-lg border border-ink/80 shadow-[3px_3px_0_0_rgba(15,23,41,0.9)]";

export const cardInteractive =
  "transition duration-150 hover:-translate-y-0.5 hover:shadow-[5px_5px_0_0_rgba(15,23,41,0.9)]";

export const cardTones = {
  paper: "bg-[#FBF8F1]",
  deep: "bg-paper-deep",
  sky: "bg-sky",
  blush: "bg-blush",
  lime: "bg-lime",
  ink: "bg-ink text-paper",
} as const;

export type CardTone = keyof typeof cardTones;
