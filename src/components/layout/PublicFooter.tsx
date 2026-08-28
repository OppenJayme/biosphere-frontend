import Link from "next/link";
import { LogoMark } from "./LogoMark";
import { FacebookIcon, TwitterIcon, GlobeIcon, MapPinIcon, PhoneIcon, MailIcon } from "@/components/icons";

const QUICK_LINKS = [
  { href: "/gallery", label: "Gallery" },
  { href: "/visit", label: "Visit" },
  { href: "/about", label: "About" },
  { href: "/inquiry", label: "Contact" },
];

const HOURS = [
  { days: "Tue – Fri", time: "9:00 AM – 5:00 PM" },
  { days: "Sat – Sun", time: "9:00 AM – 5:00 PM" },
];

export function PublicFooter() {
  return (
    <footer className="border-t border-black/10 bg-sage-50">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Link href="/" className="flex items-center gap-2.5">
            <LogoMark className="h-8 w-8 text-forest-700" />
            <span className="font-serif text-base font-semibold text-forest-800">
              USC Biological Museum
            </span>
          </Link>
          <p className="mt-3 max-w-xs text-sm text-zinc-600">
            The official biological museum of the University of San Carlos,
            dedicated to the study, preservation, and appreciation of life.
          </p>
          <div className="mt-5 flex items-center gap-3 text-forest-700">
            <a href="#" aria-label="Facebook" className="transition-colors hover:text-forest-900">
              <FacebookIcon className="h-5 w-5" />
            </a>
            <a href="#" aria-label="Twitter" className="transition-colors hover:text-forest-900">
              <TwitterIcon className="h-5 w-5" />
            </a>
            <a href="#" aria-label="Website" className="transition-colors hover:text-forest-900">
              <GlobeIcon className="h-5 w-5" />
            </a>
          </div>
        </div>

        <div>
          <p className="font-serif text-sm font-semibold text-forest-900">Quick Links</p>
          <ul className="mt-4 space-y-2.5 text-sm text-zinc-600">
            {QUICK_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="hover:text-forest-700">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="font-serif text-sm font-semibold text-forest-900">Contact Us</p>
          <ul className="mt-4 space-y-3 text-sm text-zinc-600">
            <li className="flex gap-2.5">
              <MapPinIcon className="h-4 w-4 shrink-0 translate-y-0.5 text-forest-700" />
              <span>3rd Floor, Josef Baumgartner Learning Resource Center, Talamban, Cebu</span>
            </li>
            <li className="flex gap-2.5">
              <PhoneIcon className="h-4 w-4 shrink-0 translate-y-0.5 text-forest-700" />
              <span>(032) 253 1000 local 245</span>
            </li>
            <li className="flex gap-2.5">
              <MailIcon className="h-4 w-4 shrink-0 translate-y-0.5 text-forest-700" />
              <span>biologicalmuseum@usc.edu.ph</span>
            </li>
          </ul>
        </div>

        <div>
          <p className="font-serif text-sm font-semibold text-forest-900">Hours</p>
          <dl className="mt-4 space-y-2 text-sm text-zinc-600">
            {HOURS.map((row) => (
              <div key={row.days} className="flex justify-between gap-4">
                <dt>{row.days}</dt>
                <dd>{row.time}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-xs text-zinc-500">
            Open during regular holidays for special events.
          </p>
        </div>
      </div>

      <div className="border-t border-black/10 bg-forest-900 px-6 py-4">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 text-xs text-forest-100/80 sm:flex-row">
          <p>&copy; {new Date().getFullYear()} USC Biology Museum. All Rights Reserved.</p>
          <p>Terms of Service &middot; Privacy Policy</p>
        </div>
      </div>
    </footer>
  );
}
