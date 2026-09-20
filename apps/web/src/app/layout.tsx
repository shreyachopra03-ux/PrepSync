import type { Metadata } from "next";
import "./globals.css";
import { AnalyticsProvider } from "../components/AnalyticsProvider";

export const metadata: Metadata = {
  title: "PrepSync",
  description: "AI Interview Prep Kit generator",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AnalyticsProvider />
        {children}
      </body>
    </html>
  );
}
