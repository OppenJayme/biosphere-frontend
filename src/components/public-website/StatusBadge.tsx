import type { InquiryStatus, VisitStatus } from "@/lib/dummy-data/public-website";

const INQUIRY_STYLES: Record<InquiryStatus, string> = {
  Pending: "bg-forest-100 text-forest-700",
  Reviewed: "bg-amber-100 text-amber-700",
  "Converted to Visit Request": "bg-sky-100 text-sky-700",
  Close: "bg-zinc-100 text-zinc-600",
};

const VISIT_STYLES: Record<VisitStatus, string> = {
  Pending: "bg-amber-100 text-amber-700",
  Approved: "bg-forest-100 text-forest-700",
  Declined: "bg-red-100 text-red-600",
  Cancelled: "bg-orange-100 text-orange-700",
  "Submitted for Campus Entry": "bg-sky-100 text-sky-700",
};

export function InquiryStatusBadge({ status }: { status: InquiryStatus }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium whitespace-nowrap ${INQUIRY_STYLES[status]}`}>
      {status}
    </span>
  );
}

export function VisitStatusBadge({ status }: { status: VisitStatus }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium whitespace-nowrap ${VISIT_STYLES[status]}`}>
      {status}
    </span>
  );
}

export const VISIT_STATUS_DOT: Record<VisitStatus, string> = {
  Pending: "bg-amber-500",
  Approved: "bg-forest-600",
  Declined: "bg-red-500",
  Cancelled: "bg-orange-500",
  "Submitted for Campus Entry": "bg-sky-500",
};

export const INQUIRY_STATUS_DOT: Record<InquiryStatus, string> = {
  Pending: "bg-forest-600",
  Reviewed: "bg-amber-500",
  "Converted to Visit Request": "bg-sky-500",
  Close: "bg-zinc-400",
};
