import type { ReactNode } from "react";

export { Label, PrimaryLink, SecondaryLink } from "../ds";

export function Mark({ children }: { children: ReactNode }) {
  return (
    <span className="whitespace-nowrap bg-[linear-gradient(transparent_62%,#E4F169_62%,#E4F169_92%,transparent_92%)] px-0.5">
      {children}
    </span>
  );
}
