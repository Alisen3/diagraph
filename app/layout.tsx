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
d.dataset.theme=t;d.classList.add('js');history.scrollRestoration='manual'})()`;

export const metadata: Metadata = {
  title: "DiaGraph: one causal medical knowledge graph for patients and doctors",
  description:
    "One connected health record for patients and doctors. DiaGraph is bringing health history, sourced medical knowledge and causal reasoning together.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        {/* before first paint: pick the saved or system theme, hide reveal targets only when JS can bring them back,
            and start every load at the top instead of the restored scroll position */}
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
