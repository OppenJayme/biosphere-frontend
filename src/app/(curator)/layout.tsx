import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Geist, Playfair_Display } from "next/font/google";
import { CuratorChrome } from "@/components/curator/CuratorChrome";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Curator Dashboard",
    template: "%s | BioSphere Curator",
  },
  description: "BioSphere Inventory curator dashboard for the USC Biological Museum.",
};

export default function CuratorLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${playfairDisplay.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-sage-50/60 font-sans text-zinc-900">
        <CuratorChrome>{children}</CuratorChrome>
      </body>
    </html>
  );
}
