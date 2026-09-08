// DUMMY DATA — placeholder for the curator's Public Website page (General
// Inquiries + Visit Requests). Stands in for real backend responses. Once the
// NestJS API is up, replace with calls through `features/inquiries/api.ts` and
// `features/visit-requests/api.ts` -> `apiFetch` (see docs/frontend-architecture.md)
// and delete this file.

export const PUBLIC_WEBSITE_STATS = [
  { label: "Total Inquiries", value: "132", note: "+16 vs yesterday", tone: "positive", icon: "log" },
  { label: "Pending Inquiries", value: "24", note: "+5 vs yesterday", tone: "positive", icon: "clock" },
  { label: "Visit Request", value: "48", note: "+8 vs yesterday", tone: "warning", icon: "shield" },
  { label: "Upcoming Visits", value: "12", note: "+3 vs yesterday", tone: "danger", icon: "lock" },
] as const;

export const INQUIRY_STATUSES = ["Pending", "Reviewed", "Converted to Visit Request", "Close"] as const;
export type InquiryStatus = (typeof INQUIRY_STATUSES)[number];

export const VISIT_STATUSES = ["Pending", "Approved", "Declined", "Cancelled", "Submitted for Campus Entry"] as const;
export type VisitStatus = (typeof VISIT_STATUSES)[number];

export type Sender = { name: string; initials: string; color: string };

export type Inquiry = {
  kind: "inquiry";
  id: string;
  timestamp: string;
  timestampFull: string;
  sender: Sender;
  email: string;
  subject: string;
  messagePreview: string;
  message: string;
  status: InquiryStatus;
};

export type VisitRequest = {
  kind: "visit";
  id: string;
  timestamp: string;
  timestampFull: string;
  sender: Sender;
  email: string;
  subject: string;
  messagePreview: string;
  requestedBy: string;
  contactPerson: string;
  phone: string;
  purpose: string;
  message: string;
  visitorCount: number;
  status: VisitStatus;
};

const SR: Sender = { name: "Sarah Reyes", initials: "SR", color: "bg-forest-700" };
const JD: Sender = { name: "John Doe", initials: "JD", color: "bg-sky-600" };
const EW: Sender = { name: "Emily Watson", initials: "EW", color: "bg-rose-500" };
const MJ: Sender = { name: "Mike Johnson", initials: "MJ", color: "bg-amber-600" };
const JW: Sender = { name: "James Wilson", initials: "JW", color: "bg-forest-800" };
const AP: Sender = { name: "Aisha Patel", initials: "AP", color: "bg-violet-600" };

export const INQUIRIES: Inquiry[] = [
  {
    kind: "inquiry",
    id: "INQ-2025-0522-1002",
    timestamp: "May 22, 2025 10:32 AM",
    timestampFull: "May 22, 2025 10:32 AM (PDT)",
    sender: SR,
    email: "sarah.reyes@email.com",
    subject: "Exhibit Hours",
    messagePreview: "Hi, what are the current hours for the Rain Forest bro",
    message:
      "Hi,\nWhat are the current hours for the Rain Forest Biodiversity exhibit this weekend? I'm planning to visit with my family.",
    status: "Reviewed",
  },
  {
    kind: "inquiry",
    id: "INQ-2025-0522-0918",
    timestamp: "May 22, 2025 9:18 AM",
    timestampFull: "May 22, 2025 9:18 AM (PDT)",
    sender: JD,
    email: "john.doe@email.com",
    subject: "Donation Inquiry",
    messagePreview: "I would like to donate a collection of pinned butterflies. Can you provide details?",
    message: "I would like to donate a collection of pinned butterflies. Can you provide details on how the museum accepts donations?",
    status: "Reviewed",
  },
  {
    kind: "inquiry",
    id: "INQ-2025-0522-0845",
    timestamp: "May 22, 2025 8:45 AM",
    timestampFull: "May 22, 2025 8:45 AM (PDT)",
    sender: EW,
    email: "emily.watson@email.com",
    subject: "Species Identification",
    messagePreview: "Can you help me identify this marine specimen found in tide pool?",
    message: "Can you help me identify this marine specimen found in a tide pool? I've attached photos separately by email.",
    status: "Pending",
  },
  {
    kind: "inquiry",
    id: "INQ-2025-0521-1622",
    timestamp: "May 21, 2025 4:22 PM",
    timestampFull: "May 21, 2025 4:22 PM (PDT)",
    sender: MJ,
    email: "mike.johnson@email.com",
    subject: "School Field Trip",
    messagePreview: "We are interested in scheduling a field trip for our biology class.",
    message: "We are interested in scheduling a field trip for our biology class of 30 students. What are the available dates?",
    status: "Converted to Visit Request",
  },
  {
    kind: "inquiry",
    id: "INQ-2025-0520-1327",
    timestamp: "May 20, 2025 1:27 PM",
    timestampFull: "May 20, 2025 1:27 PM (PDT)",
    sender: JW,
    email: "james.wilson@email.com",
    subject: "Tour Availability",
    messagePreview: "Do you offer guided tours on weekdays?",
    message: "Do you offer guided tours on weekdays? I'm hoping to bring a small group of colleagues.",
    status: "Reviewed",
  },
  {
    kind: "inquiry",
    id: "INQ-2025-0520-1005",
    timestamp: "May 20, 2025 10:05 AM",
    timestampFull: "May 20, 2025 10:05 AM (PDT)",
    sender: AP,
    email: "aisha.patel@email.com",
    subject: "Publication Request",
    messagePreview: "Requesting permission to use images for an academic publication.",
    message: "Requesting permission to use exhibit images for an academic publication on Philippine biodiversity.",
    status: "Pending",
  },
];

export const VISIT_REQUESTS: VisitRequest[] = [
  {
    kind: "visit",
    id: "INQ-2025-0522-1001",
    timestamp: "May 22, 2025 10:32 AM",
    timestampFull: "May 22, 2025 10:32 AM (PDT)",
    sender: SR,
    email: "sarah.reyes@email.com",
    subject: "Exhibit Hours",
    messagePreview: "Hi, what are the current hours for the Rain Forest bro",
    requestedBy: "University of Cebu Biology Students",
    contactPerson: "Mark Anthony Lim",
    phone: "+63 XXX XXX XXXX",
    purpose: "Educational Tour",
    message: "We are interested in a guided tour and learning more about the specimens in your collection",
    visitorCount: 24,
    status: "Approved",
  },
  {
    kind: "visit",
    id: "INQ-2025-0522-0918",
    timestamp: "May 22, 2025 9:18 AM",
    timestampFull: "May 22, 2025 9:18 AM (PDT)",
    sender: JD,
    email: "john.doe@email.com",
    subject: "Donation Inquiry",
    messagePreview: "I would like to donate a collection of pinned butterflies. Can you provide details?",
    requestedBy: "Independent Researcher",
    contactPerson: "John Doe",
    phone: "+63 XXX XXX XXXX",
    purpose: "Specimen Donation",
    message: "I would like to donate a collection of pinned butterflies and discuss accession in person.",
    visitorCount: 1,
    status: "Declined",
  },
  {
    kind: "visit",
    id: "INQ-2025-0522-0845",
    timestamp: "May 22, 2025 8:45 AM",
    timestampFull: "May 22, 2025 8:45 AM (PDT)",
    sender: EW,
    email: "emily.watson@email.com",
    subject: "Species Identification",
    messagePreview: "Can you help me identify this marine specimen found in tide pool?",
    requestedBy: "Independent Researcher",
    contactPerson: "Emily Watson",
    phone: "+63 XXX XXX XXXX",
    purpose: "Specimen Consultation",
    message: "Would like to bring the specimen in person for identification.",
    visitorCount: 2,
    status: "Pending",
  },
  {
    kind: "visit",
    id: "INQ-2025-0521-1622",
    timestamp: "May 21, 2025 4:22 PM",
    timestampFull: "May 21, 2025 4:22 PM (PDT)",
    sender: MJ,
    email: "mike.johnson@email.com",
    subject: "School Field Trip",
    messagePreview: "We are interested in scheduling a field trip for our biology class.",
    requestedBy: "USC College of Science Biology Dept.",
    contactPerson: "Mike Johnson",
    phone: "+63 XXX XXX XXXX",
    purpose: "Educational Tour",
    message: "We are interested in scheduling a field trip for our biology class of 30 students.",
    visitorCount: 30,
    status: "Submitted for Campus Entry",
  },
  {
    kind: "visit",
    id: "INQ-2025-0520-1327",
    timestamp: "May 20, 2025 1:27 PM",
    timestampFull: "May 20, 2025 1:27 PM (PDT)",
    sender: JW,
    email: "james.wilson@email.com",
    subject: "Tour Availability",
    messagePreview: "Do you offer guided tours on weekdays?",
    requestedBy: "Cebu Nature Society",
    contactPerson: "James Wilson",
    phone: "+63 XXX XXX XXXX",
    purpose: "Guided Tour",
    message: "Hoping to bring a small group of colleagues on a weekday afternoon.",
    visitorCount: 8,
    status: "Cancelled",
  },
];
