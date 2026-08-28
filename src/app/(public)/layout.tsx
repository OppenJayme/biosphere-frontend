import type { Metadata } from "next";
import { Geist, Playfair_Display } from "next/font/google";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";
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
    default: "BioSphere | USC Biological Museum",
    template: "%s | BioSphere",
  },
  description:
    "BioSphere is the digital home of the University of San Carlos Biological Museum: explore the gallery, plan your visit, and get in touch.",
};

export default function PublicLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${playfairDisplay.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-white font-sans text-zinc-900">
        <PublicHeader />
        <main className="flex-1">{children}</main>
        <PublicFooter />
      </body>
    </html>
  );
}
