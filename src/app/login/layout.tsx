import type { Metadata } from "next";
import { Geist, Playfair_Display } from "next/font/google";
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
    default: "Curator Sign In",
    template: "%s | BioSphere",
  },
  description: "Sign in to the BioSphere Inventory curator system.",
};

export default function LoginLayout({ children }: LayoutProps<"/login">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${playfairDisplay.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-white font-sans text-zinc-900">{children}</body>
    </html>
  );
}
