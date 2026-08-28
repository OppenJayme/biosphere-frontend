import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function CalendarIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
      <path d="M3.5 9.5h17M8 3v3.5M16 3v3.5" />
    </svg>
  );
}

export function MailIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="m4 6.5 8 6.5 8-6.5" />
    </svg>
  );
}

export function UserIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="8.3" r="3.3" />
      <path d="M5 20c0-3.6 3.1-6.3 7-6.3s7 2.7 7 6.3" />
    </svg>
  );
}

export function LeafIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M19 5C9 5 4.5 11 4.5 17.5 14.5 17.5 19 12 19 5Z" />
      <path d="M6 19c2-4 5-7.5 12.5-13" />
    </svg>
  );
}

export function BookOpenIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 6.2C10.3 5 7.7 4.5 4.5 4.7v13.6c3.2-.2 5.8.3 7.5 1.5 1.7-1.2 4.3-1.7 7.5-1.5V4.7c-3.2-.2-5.8.3-7.5 1.5Z" />
      <path d="M12 6.2v13.6" />
    </svg>
  );
}

export function GlobeIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17M12 3.5c2.5 2.4 3.8 5.3 3.8 8.5s-1.3 6.1-3.8 8.5c-2.5-2.4-3.8-5.3-3.8-8.5S9.5 5.9 12 3.5Z" />
    </svg>
  );
}

export function MapPinIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 21.5S5 15 5 9.8a7 7 0 1 1 14 0C19 15 12 21.5 12 21.5Z" />
      <circle cx="12" cy="9.8" r="2.4" />
    </svg>
  );
}

export function PhoneIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M5.5 4.5h3.2l1.5 4-2 1.6a12 12 0 0 0 5.7 5.7l1.6-2 4 1.5v3.2c0 1-.9 1.8-1.9 1.6-4-.6-7.7-2.5-10.6-5.4C4.2 13 2.3 9.3 1.7 5.3a1.8 1.8 0 0 1 1.6-1.9c.7-.1 1.5-.1 2.2 0Z" />
    </svg>
  );
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 12h16M13 5l7 7-7 7" />
    </svg>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="m4.5 12.5 5 5 10-11" />
    </svg>
  );
}

export function MenuIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

export function BugIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="8.5" y="8" width="7" height="10" rx="3.5" />
      <path d="M12 8V5.5M9.5 6l-1.7-1.7M14.5 6l1.7-1.7M5 10l3 1.3M19 10l-3 1.3M5 17l3-1.3M19 17l-3-1.3M9.5 18.5 8 21M14.5 18.5 16 21" />
    </svg>
  );
}

export function LizardIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 16c1.5-3 3.8-4.8 6.5-4.8 2 0 3 1 4.3 1 1.6 0 2.7-1.4 4.2-1.4.7 0 1.5.3 2 .8" />
      <circle cx="16.3" cy="8.2" r="1.9" />
      <path d="M10.5 11.2 8 8.5M7.5 15 4.5 17.5M11 15.5l-1.5 3.3M14 15.8l.5 3.4" />
    </svg>
  );
}

export function FishIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 12c3-4 7-5.5 10.5-5.5S20.5 9 20.5 12 17 17.5 14.5 17.5 7 15 4 12Z" />
      <path d="M4 12 1.5 9.5M4 12l-2.5 2.5M14.5 6.5V4M14.5 19.5v-2.5" />
      <circle cx="15.7" cy="10.7" r=".6" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function CompassIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m14.8 9.2-1.6 4.4-4.4 1.6 1.6-4.4 4.4-1.6Z" />
    </svg>
  );
}

export function ShieldIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3.5 19 6v6c0 4.5-3 7.5-7 8.5-4-1-7-4-7-8.5V6l7-2.5Z" />
    </svg>
  );
}

export function SparkleIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3.5c.5 3 2 4.5 5 5-3 .5-4.5 2-5 5-.5-3-2-4.5-5-5 3-.5 4.5-2 5-5Z" />
      <path d="M18.5 15c.3 1.5 1 2.2 2.5 2.5-1.5.3-2.2 1-2.5 2.5-.3-1.5-1-2.2-2.5-2.5 1.5-.3 2.2-1 2.5-2.5Z" />
    </svg>
  );
}

export function CarIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4.5 16v-2.7l2-4.4a2 2 0 0 1 1.8-1.2h7.4a2 2 0 0 1 1.8 1.2l2 4.4V16" />
      <rect x="3" y="16" width="18" height="3.5" rx="1.5" />
      <circle cx="7.5" cy="19.5" r="1.3" />
      <circle cx="16.5" cy="19.5" r="1.3" />
    </svg>
  );
}

export function InfoIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5.5" />
      <circle cx="12" cy="8" r=".2" fill="currentColor" stroke="currentColor" strokeWidth={2.4} />
    </svg>
  );
}

export function LinkedInIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M6.94 8.5a1.94 1.94 0 1 0 0-3.88 1.94 1.94 0 0 0 0 3.88ZM5.25 10.25h3.38v8.5H5.25v-8.5Zm5.63 0h3.24v1.16h.05c.45-.82 1.55-1.68 3.19-1.68 3.41 0 4.04 2.16 4.04 4.98v5.04h-3.38v-4.47c0-1.07-.02-2.44-1.5-2.44-1.5 0-1.73 1.16-1.73 2.36v4.55h-3.38v-8.5Z" />
    </svg>
  );
}

export function FacebookIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M13.5 21v-7.5H16l.4-3H13.5V8.4c0-.9.25-1.5 1.55-1.5H16.5V4.3C16.2 4.26 15.2 4.17 14 4.17c-2.4 0-4 1.46-4 4.14V10.5H7.5v3H10V21h3.5Z" />
    </svg>
  );
}

export function TwitterIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M20.5 6.5c-.6.3-1.3.5-2 .6a3.4 3.4 0 0 0 1.5-1.9c-.7.4-1.4.7-2.2.9a3.4 3.4 0 0 0-5.9 3.1A9.7 9.7 0 0 1 4.8 5.9a3.4 3.4 0 0 0 1.1 4.6c-.6 0-1.1-.2-1.6-.4v.1a3.4 3.4 0 0 0 2.7 3.3c-.5.1-1 .2-1.6.1a3.4 3.4 0 0 0 3.2 2.4A6.9 6.9 0 0 1 3.5 17.4a9.7 9.7 0 0 0 5.3 1.6c6.3 0 9.8-5.3 9.8-9.8v-.4c.7-.5 1.3-1.1 1.9-1.8Z" />
    </svg>
  );
}
