import type { Metadata } from "next";
import { Atkinson_Hyperlegible_Next } from "next/font/google";
import "./globals.css";

const atkinson = Atkinson_Hyperlegible_Next({
  subsets: ["latin", "latin-ext"],
  variable: "--font-atkinson",
});

export const metadata: Metadata = {
  title: "DiaGraph: a medical knowledge graph for patients and clinicians",
  description:
    "DiaGraph turns health records into a timeline of findings linked to sourced medical knowledge. CS491 Senior Design Project, Bilkent University.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={atkinson.variable}>
      <body>{children}</body>
    </html>
  );
}
