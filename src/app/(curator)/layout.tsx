import type { Metadata } from "next";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { Geist, Playfair_Display } from "next/font/google";
import { CuratorChrome } from "@/components/curator/CuratorChrome";
import { getCurrentAccount } from "@/features/auth/api";
import { verifySession } from "@/lib/session";
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

export default async function CuratorLayout({ children }: { children: ReactNode }) {
  const user = await verifySession();
  if (!user) redirect("/login");

  let profile: { fullName: string; role: string } | null = null;
  try {
    profile = await getCurrentAccount();
  } catch {
    // Rendered as a generic fallback in the topbar; each page's own data
    // fetch is what surfaces a real "backend unavailable" state.
    profile = null;
  }

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${playfairDisplay.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-sage-50/60 font-sans text-zinc-900">
        <CuratorChrome ownerId={user.id} profile={profile}>
          {children}
        </CuratorChrome>
      </body>
    </html>
  );
}
