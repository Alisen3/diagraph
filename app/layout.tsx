import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// Substitute for PP Neue Montreal, as the design system recommends.
const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-sans",
});

const THEME_SCRIPT = `(function(){var d=document.documentElement,t;try{t=localStorage.getItem('theme')}catch(e){}
if(t!=='light'&&t!=='dark')t=matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';
d.dataset.theme=t;d.classList.add('js')})()`;

export const metadata: Metadata = {
  title: "DiaGraph: a medical knowledge graph for patients and clinicians",
  description:
    "DiaGraph turns health records into a timeline of findings linked to sourced medical knowledge. CS491 Senior Design Project, Bilkent University.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        {/* before first paint: pick the saved or system theme, and hide reveal targets only when JS can bring them back */}
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
