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

export function LockIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="5" y="10.5" width="14" height="10" rx="2.5" />
      <path d="M8 10.5V7.8a4 4 0 0 1 8 0v2.7" />
    </svg>
  );
}

export function EyeIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="2.8" />
    </svg>
  );
}

export function EyeOffIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3.5 3.5l17 17" />
      <path d="M10.6 5.7c.45-.1.9-.15 1.4-.15 6 0 9.5 6.5 9.5 6.5a15.6 15.6 0 0 1-3.4 4.2M6.8 6.9A15.8 15.8 0 0 0 2.5 12S6 18.5 12 18.5c1.4 0 2.7-.35 3.8-.9" />
      <path d="M9.9 10.1a2.8 2.8 0 0 0 3.9 3.9" />
    </svg>
  );
}

export function PanelIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" />
      <path d="M3.5 9h17" />
    </svg>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

export function BellIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M6 10.5a6 6 0 1 1 12 0c0 4 1.3 5.5 1.7 6H4.3c.4-.5 1.7-2 1.7-6Z" />
      <path d="M10 19.5a2 2 0 0 0 4 0" />
    </svg>
  );
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function DotsIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <circle cx="12" cy="5.5" r="1.8" />
      <circle cx="12" cy="12" r="1.8" />
      <circle cx="12" cy="18.5" r="1.8" />
    </svg>
  );
}

export function PencilIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M15.5 5.5 18.5 8.5 8 19H5v-3Z" />
      <path d="m13.7 7.3 3 3" />
    </svg>
  );
}

export function ChartBarIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 20V10.5M12 20V4M20 20v-6.5" />
      <path d="M4 20h16" />
    </svg>
  );
}

export function GridIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
    </svg>
  );
}

export function CubeIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3.5 20 8v8l-8 4.5L4 16V8Z" />
      <path d="M4 8l8 4.5L20 8M12 12.5V21" />
    </svg>
  );
}

export function ClipboardIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="5.5" y="4.5" width="13" height="16" rx="2" />
      <path d="M9 4.5V3.8A1.8 1.8 0 0 1 10.8 2h2.4A1.8 1.8 0 0 1 15 3.8v.7" />
      <path d="m9 13 2 2 4-4.5" />
    </svg>
  );
}

export function UsersIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="9" cy="8.3" r="3" />
      <path d="M3.5 20c0-3.3 2.5-5.8 5.5-5.8s5.5 2.5 5.5 5.8" />
      <path d="M15.5 5.5c1.5.3 2.5 1.5 2.5 3s-1 2.7-2.5 3" />
      <path d="M17.5 14.5c2 .4 3 2 3 5.5" />
    </svg>
  );
}

export function HierarchyIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="5" r="2.3" />
      <circle cx="6" cy="19" r="2.3" />
      <circle cx="18" cy="19" r="2.3" />
      <path d="M12 7.3V12M12 12 6 16.7M12 12l6 4.7" />
    </svg>
  );
}

export function PawIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="15.5" r="4" />
      <circle cx="6" cy="9" r="2" />
      <circle cx="10.3" cy="5.8" r="2" />
      <circle cx="13.7" cy="5.8" r="2" />
      <circle cx="18" cy="9" r="2" />
    </svg>
  );
}

export function ArchiveIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3.5" y="4.5" width="17" height="5" rx="1.5" />
      <path d="M5 9.5V18a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 19 18V9.5" />
      <path d="M10 13.5h4" />
    </svg>
  );
}

export function DocumentTextIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M7 3.5h7.5L18 7v13.5H7Z" />
      <path d="M14.3 3.5V7H18" />
      <path d="M9.5 12h5M9.5 15.3h5M9.5 18.6h3" />
    </svg>
  );
}

export function ChevronLeftIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="m15 6-6 6 6 6" />
    </svg>
  );
}

export function ListIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M8.5 6.5h12M8.5 12h12M8.5 17.5h12" />
      <path d="M3.8 6.5h.01M3.8 12h.01M3.8 17.5h.01" strokeWidth={2.4} />
    </svg>
  );
}

export function DownloadIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3.5v11.5M7.5 11l4.5 4.5L16.5 11" />
      <path d="M4.5 17v2a1.5 1.5 0 0 0 1.5 1.5h12a1.5 1.5 0 0 0 1.5-1.5v-2" />
    </svg>
  );
}

export function UploadIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 20.5V9M7.5 13l4.5-4.5L16.5 13" />
      <path d="M4.5 17v2a1.5 1.5 0 0 0 1.5 1.5h12a1.5 1.5 0 0 0 1.5-1.5v-2" />
    </svg>
  );
}

export function QrCodeIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3.5" y="3.5" width="6.5" height="6.5" rx="1" />
      <rect x="14" y="3.5" width="6.5" height="6.5" rx="1" />
      <rect x="3.5" y="14" width="6.5" height="6.5" rx="1" />
      <path d="M14 14h3v3h-3zM19.5 14h1v1h-1zM14 19.5h1v1h-1zM19.5 19.5h1v1h-1z" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function ClockIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3.2 2" />
    </svg>
  );
}

export function MoveIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3v18M3 12h18" />
      <path d="m8.5 6.5 3.5-3.5 3.5 3.5M8.5 17.5l3.5 3.5 3.5-3.5M6.5 8.5 3 12l3.5 3.5M17.5 8.5 21 12l-3.5 3.5" />
    </svg>
  );
}

export function HomeIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="m4 11 8-6.5 8 6.5" />
      <path d="M6 9.5V19a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V9.5" />
    </svg>
  );
}

export function PrinterIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M7 8.5V4h10v4.5" />
      <rect x="4.5" y="8.5" width="15" height="8" rx="1.8" />
      <path d="M7 14.5h10V20H7Z" />
    </svg>
  );
}

export function AlertTriangleIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 4 21.5 20h-19Z" />
      <path d="M12 10v4.5" />
      <circle cx="12" cy="17.3" r=".2" fill="currentColor" stroke="currentColor" strokeWidth={2.2} />
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
