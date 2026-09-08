// DUMMY DATA — placeholder for the Audit Logs page UI.
// Stands in for real backend responses. Once the NestJS API is up, replace
// with calls through `features/audit-log/api.ts` -> `apiFetch` (see
// docs/frontend-architecture.md) and delete this file.

export const AUDIT_STATS = [
  { label: "Total Logs", value: "8,742", note: "+312 vs yesterday", tone: "positive", icon: "log" },
  { label: "Today's Activity", value: "214", note: "+18 vs yesterday", tone: "positive", icon: "clock" },
  { label: "Security Events", value: "28", note: "+6 vs yesterday", tone: "warning", icon: "shield" },
  { label: "Failed Attempts", value: "11", note: "+4 vs yesterday", tone: "danger", icon: "lock" },
] as const;

export const AUDIT_FILTERS = {
  module: ["Module", "All", "Cataloging", "QR Exhibits", "User Management", "Location", "Backup", "Visit Requests", "Inquiries"],
  action: ["Action", "All", "Created", "Updated", "Deleted", "Login", "Published", "Generated", "Approved", "Closed"],
  user: ["All Users", "Sarah Reyes", "John Doe", "Mike Johnson", "Emily Watson", "Charles Benedict", "System"],
} as const;

export const LOG_CATEGORIES = ["All", "Security", "Inventory", "QR Exhibits", "User Management", "Backup"] as const;
export type LogCategory = (typeof LOG_CATEGORIES)[number];

export type LogResult = "Success" | "Failed";

export type LogActor =
  | { kind: "user"; name: string; initials: string; color: string }
  | { kind: "system" }
  | { kind: "unknown" };

export type TimelineStep = { time: string; label: string };

export type AuditLog = {
  id: string;
  category: Exclude<LogCategory, "All">;
  module: string;
  timestamp: string;
  timestampFull: string;
  actor: LogActor;
  role: string;
  ipAddress: string;
  device: string;
  action: string;
  affectedRecord: string;
  details: string;
  result: LogResult;
  timeline: TimelineStep[];
};

const SARAH: LogActor = { kind: "user", name: "Sarah Reyes", initials: "SR", color: "bg-forest-700" };
const JOHN: LogActor = { kind: "user", name: "John Doe", initials: "JD", color: "bg-sky-600" };
const MIKE: LogActor = { kind: "user", name: "Mike Johnson", initials: "MJ", color: "bg-amber-600" };
const EMILY: LogActor = { kind: "user", name: "Emily Watson", initials: "EW", color: "bg-rose-500" };
const CHARLES: LogActor = { kind: "user", name: "Charles Benedict", initials: "CB", color: "bg-violet-600" };
const SYSTEM: LogActor = { kind: "system" };
const UNKNOWN: LogActor = { kind: "unknown" };

export const AUDIT_LOGS: AuditLog[] = [
  {
    id: "LOG-2025-0522-1025",
    category: "Inventory",
    module: "Cataloging",
    timestamp: "May 22, 2025 10:25 AM",
    timestampFull: "May 22, 2025 10:25:31 AM (PDT)",
    actor: SARAH,
    role: "Curator",
    ipAddress: "192.168.1.45",
    device: "Chrome 124.0.0 / Windows 11",
    action: "Specimen Updated",
    affectedRecord: "Specimen USCBM-HERP-2025-001",
    details: "Updated taxonomy (Python regius) and storage location to Room 1, Cabinet 4, Shelf A.",
    result: "Success",
    timeline: [
      { time: "10:25:31 AM", label: "Action performed" },
      { time: "10:25:32 AM", label: "Record saved" },
      { time: "10:25:33 AM", label: "Changes committed" },
    ],
  },
  {
    id: "LOG-2025-0522-0958",
    category: "QR Exhibits",
    module: "QR Exhibits",
    timestamp: "May 22, 2025 9:58 AM",
    timestampFull: "May 22, 2025 9:58:12 AM (PDT)",
    actor: JOHN,
    role: "Curator",
    ipAddress: "192.168.1.52",
    device: "Safari 17.4 / macOS 14",
    action: "Exhibit Published",
    affectedRecord: "Exhibit Ball Python",
    details: "Published QR exhibit to public view.",
    result: "Success",
    timeline: [
      { time: "9:58:12 AM", label: "Action performed" },
      { time: "9:58:13 AM", label: "Record saved" },
      { time: "9:58:14 AM", label: "Changes committed" },
    ],
  },
  {
    id: "LOG-2025-0522-0941",
    category: "QR Exhibits",
    module: "QR Exhibits",
    timestamp: "May 22, 2025 9:41 AM",
    timestampFull: "May 22, 2025 9:41:05 AM (PDT)",
    actor: MIKE,
    role: "Curator",
    ipAddress: "192.168.1.61",
    device: "Chrome 124.0.0 / Windows 11",
    action: "QR Code Generated",
    affectedRecord: "Exhibit Ball Python",
    details: "Generated new QR code for exhibit.",
    result: "Success",
    timeline: [
      { time: "9:41:05 AM", label: "Action performed" },
      { time: "9:41:06 AM", label: "QR code created" },
      { time: "9:41:06 AM", label: "Changes committed" },
    ],
  },
  {
    id: "LOG-2025-0522-0920",
    category: "User Management",
    module: "User Management",
    timestamp: "May 22, 2025 9:20 AM",
    timestampFull: "May 22, 2025 9:20:47 AM (PDT)",
    actor: EMILY,
    role: "Curator",
    ipAddress: "192.168.1.33",
    device: "Edge 124.0.0 / Windows 11",
    action: "User Invited",
    affectedRecord: "User Jane Doe",
    details: "Invited curator with edit access.",
    result: "Success",
    timeline: [
      { time: "9:20:47 AM", label: "Action performed" },
      { time: "9:20:48 AM", label: "Invite email queued" },
      { time: "9:20:49 AM", label: "Changes committed" },
    ],
  },
  {
    id: "LOG-2025-0522-0855",
    category: "Inventory",
    module: "Location",
    timestamp: "May 22, 2025 8:55 AM",
    timestampFull: "May 22, 2025 8:55:19 AM (PDT)",
    actor: SARAH,
    role: "Curator",
    ipAddress: "192.168.1.45",
    device: "Chrome 124.0.0 / Windows 11",
    action: "Location Updated",
    affectedRecord: "Room 1, Cabinet 4, Shelf A",
    details: "Updated cabinet and shelf information.",
    result: "Success",
    timeline: [
      { time: "8:55:19 AM", label: "Action performed" },
      { time: "8:55:20 AM", label: "Record saved" },
      { time: "8:55:20 AM", label: "Changes committed" },
    ],
  },
  {
    id: "LOG-2025-0522-0832",
    category: "Security",
    module: "User Management",
    timestamp: "May 22, 2025 8:32 AM",
    timestampFull: "May 22, 2025 8:32:03 AM (PDT)",
    actor: CHARLES,
    role: "Curator",
    ipAddress: "192.168.1.72",
    device: "Chrome 124.0.0 / Windows 11",
    action: "Login",
    affectedRecord: "—",
    details: "User logged in successfully.",
    result: "Success",
    timeline: [
      { time: "8:32:03 AM", label: "Credentials verified" },
      { time: "8:32:04 AM", label: "Session created" },
    ],
  },
  {
    id: "LOG-2025-0522-0821",
    category: "Security",
    module: "User Management",
    timestamp: "May 22, 2025 8:21 AM",
    timestampFull: "May 22, 2025 8:21:55 AM (PDT)",
    actor: UNKNOWN,
    role: "—",
    ipAddress: "203.0.113.19",
    device: "Chrome 121.0.0 / Android 14",
    action: "Login",
    affectedRecord: "—",
    details: "Failed login attempt.",
    result: "Failed",
    timeline: [
      { time: "8:21:55 AM", label: "Credentials rejected" },
      { time: "8:21:55 AM", label: "Attempt logged" },
    ],
  },
  {
    id: "LOG-2025-0522-0758",
    category: "Backup",
    module: "Backup",
    timestamp: "May 22, 2025 7:58 AM",
    timestampFull: "May 22, 2025 7:58:00 AM (PDT)",
    actor: SYSTEM,
    role: "System",
    ipAddress: "—",
    device: "Scheduled task",
    action: "Backup Created",
    affectedRecord: "Daily Backup 2025-05-22",
    details: "Automated daily database backup completed.",
    result: "Success",
    timeline: [
      { time: "7:58:00 AM", label: "Backup started" },
      { time: "7:58:41 AM", label: "Backup completed" },
    ],
  },
  {
    id: "LOG-2025-0521-1615",
    category: "Inventory",
    module: "Visit Requests",
    timestamp: "May 21, 2025 4:15 PM",
    timestampFull: "May 21, 2025 4:15:22 PM (PDT)",
    actor: SARAH,
    role: "Curator",
    ipAddress: "192.168.1.45",
    device: "Chrome 124.0.0 / Windows 11",
    action: "Visit Approved",
    affectedRecord: "Request VR-2025-0142",
    details: "Approved visit request for May 30, 2025.",
    result: "Success",
    timeline: [
      { time: "4:15:22 PM", label: "Action performed" },
      { time: "4:15:23 PM", label: "Reply email queued" },
    ],
  },
  {
    id: "LOG-2025-0521-1615-2",
    category: "Inventory",
    module: "Inquiries",
    timestamp: "May 21, 2025 4:15 PM",
    timestampFull: "May 21, 2025 4:15:09 PM (PDT)",
    actor: JOHN,
    role: "Curator",
    ipAddress: "192.168.1.52",
    device: "Safari 17.4 / macOS 14",
    action: "Inquiry Closed",
    affectedRecord: "Inquiry INQ-2025-0078",
    details: "Closed inquiry: Habitat preference for species",
    result: "Success",
    timeline: [
      { time: "4:15:09 PM", label: "Action performed" },
      { time: "4:15:10 PM", label: "Changes committed" },
    ],
  },
];
