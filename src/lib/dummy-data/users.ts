// DUMMY DATA — placeholder for the curator Users (account management) page.
// Stands in for real backend responses. Once the NestJS API is up, replace
// with calls through `features/curator-accounts/api.ts` -> `apiFetch` (see
// docs/frontend-architecture.md) and delete this file.

export const USER_STATS = [
  { label: "Total Users", value: "48", note: "+5 this month", tone: "positive", icon: "specimen" },
  { label: "Active Curators", value: "32", note: "66.7% of total", tone: "positive", icon: "clock" },
  { label: "Pending Invitations", value: "7", note: "14.6% of total", tone: "warning", icon: "mail" },
  { label: "Inactive Accounts", value: "9", note: "18.8% of total", tone: "danger", icon: "lock" },
] as const;

export const USER_FILTERS = {
  role: ["All Roles", "Curator", "Collection Manager", "Data Specialist", "Research Assistant"],
  status: ["All Statuses", "Active", "Pending Invite", "Inactive"],
} as const;

export type UserStatus = "Active" | "Pending Invite" | "Inactive";
export type CuratorRole = "Curator" | "Collection Manager" | "Data Specialist" | "Research Assistant";

export type ActivityEntry = { description: string; timestamp: string };

export type CuratorUser = {
  id: string;
  name: string;
  email: string;
  role: CuratorRole;
  status: UserStatus;
  lastSignIn: string | null;
  createdOn: string;
  createdOnFull: string;
  initials: string;
  color: string;
  recentActivity: ActivityEntry[];
};

export const USERS: CuratorUser[] = [
  {
    id: "usr-sheldon",
    name: "Dr. Sheldon Cruz",
    email: "sheldon.cruz@usc.edu",
    role: "Curator",
    status: "Active",
    lastSignIn: "May 22, 2025 10:30 AM",
    createdOn: "Mar 10, 2024",
    createdOnFull: "Mar 10, 2024 08:15 AM",
    initials: "SC",
    color: "bg-amber-700",
    recentActivity: [
      { description: "Signed in to the system", timestamp: "May 22, 2025 10:30 AM" },
      { description: "Updated specimen record USCBM-HYM-2025-0112", timestamp: "May 22, 2025 9:42 AM" },
      { description: "Exported Inventory by Location report", timestamp: "May 21, 2025 4:15 PM" },
    ],
  },
  {
    id: "usr-sarah",
    name: "Sarah Reyes",
    email: "sarah.reyes@usc.edu",
    role: "Collection Manager",
    status: "Active",
    lastSignIn: "May 21, 2025 2:18 PM",
    createdOn: "Jan 18, 2024",
    createdOnFull: "Jan 18, 2024 09:00 AM",
    initials: "SR",
    color: "bg-forest-700",
    recentActivity: [
      { description: "Updated taxonomy and storage location", timestamp: "May 22, 2025 10:25 AM" },
      { description: "Approved visit request VR-2025-0142", timestamp: "May 21, 2025 4:15 PM" },
    ],
  },
  {
    id: "usr-mark",
    name: "Mark Cruz",
    email: "mark.cruz@usc.edu",
    role: "Data Specialist",
    status: "Active",
    lastSignIn: "May 20, 2025 11:05 AM",
    createdOn: "Apr 2, 2024",
    createdOnFull: "Apr 2, 2024 01:30 PM",
    initials: "MC",
    color: "bg-sky-600",
    recentActivity: [{ description: "Updated cabinet and shelf information", timestamp: "May 20, 2025 11:05 AM" }],
  },
  {
    id: "usr-lauren",
    name: "Lauren Kim",
    email: "lauren.kim@usc.edu",
    role: "Curator",
    status: "Pending Invite",
    lastSignIn: null,
    createdOn: "May 20, 2025",
    createdOnFull: "May 20, 2025 3:40 PM",
    initials: "LK",
    color: "bg-rose-500",
    recentActivity: [],
  },
  {
    id: "usr-james",
    name: "James Thornton",
    email: "james.thornton@usc.edu",
    role: "Collection Manager",
    status: "Active",
    lastSignIn: "May 19, 2025 5:45 PM",
    createdOn: "Oct 12, 2023",
    createdOnFull: "Oct 12, 2023 10:00 AM",
    initials: "JT",
    color: "bg-violet-600",
    recentActivity: [{ description: "Closed inquiry INQ-2025-0078", timestamp: "May 19, 2025 5:45 PM" }],
  },
  {
    id: "usr-rebecca",
    name: "Rebecca Lee",
    email: "rebecca.lee@usc.edu",
    role: "Research Assistant",
    status: "Inactive",
    lastSignIn: "Apr 30, 2025 9:14 AM",
    createdOn: "Jun 22, 2023",
    createdOnFull: "Jun 22, 2023 2:00 PM",
    initials: "RL",
    color: "bg-zinc-500",
    recentActivity: [],
  },
  {
    id: "usr-ethan",
    name: "Ethan Walker",
    email: "ethan.walker@usc.edu",
    role: "Data Specialist",
    status: "Active",
    lastSignIn: "May 18, 2025 4:12 PM",
    createdOn: "Aug 15, 2023",
    createdOnFull: "Aug 15, 2023 11:20 AM",
    initials: "EW",
    color: "bg-amber-600",
    recentActivity: [{ description: "Generated new QR code for exhibit", timestamp: "May 18, 2025 4:12 PM" }],
  },
  {
    id: "usr-maya",
    name: "Maya Patel",
    email: "maya.patel@usc.edu",
    role: "Research Assistant",
    status: "Pending Invite",
    lastSignIn: null,
    createdOn: "May 17, 2025",
    createdOnFull: "May 17, 2025 8:55 AM",
    initials: "MP",
    color: "bg-sky-700",
    recentActivity: [],
  },
  {
    id: "usr-david",
    name: "David Nguyen",
    email: "david.nguyen@usc.edu",
    role: "Curator",
    status: "Inactive",
    lastSignIn: "Mar 12, 2025 3:21 PM",
    createdOn: "Feb 1, 2023",
    createdOnFull: "Feb 1, 2023 9:10 AM",
    initials: "DN",
    color: "bg-forest-900",
    recentActivity: [],
  },
];
