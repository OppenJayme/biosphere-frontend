import type { Metadata } from "next";
import type { ReactNode } from "react";
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
    default: "Online Exhibit",
    template: "%s | BioSphere Exhibit",
  },
  description: "An unlisted BioSphere specimen exhibit — reachable only by QR code or direct link.",
};

// Deliberately outside the (public) route group: QR exhibit pages are
// unlisted, reached only by scanning a code or a direct URL, and use their
// own compact chrome instead of the full site header/nav/footer.
export default function ExhibitsLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${playfairDisplay.variable} h-full antialiased`}
    >
      <body className="min-h-full font-sans">{children}</body>
    </html>
  );
}
