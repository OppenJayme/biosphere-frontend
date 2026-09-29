import type { InquiryStatus } from "@/features/inquiries/types";
import { INQUIRY_STATUS_LABELS } from "@/features/inquiries/workflow";
import type { VisitRequestStatus } from "@/features/visit-requests/types";
import { VISIT_REQUEST_STATUS_LABELS } from "@/features/visit-requests/workflow";

const INQUIRY_STYLES: Record<InquiryStatus, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  REVIEWED: "bg-sky-100 text-sky-800",
  TURNED_TO_VISIT_REQUEST: "bg-forest-100 text-forest-700",
  CLOSED: "bg-zinc-100 text-zinc-600",
};

const VISIT_STYLES: Record<VisitRequestStatus, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  APPROVED_BY_CURATOR: "bg-forest-100 text-forest-700",
  SUBMITTED_FOR_CAMPUS_ENTRY: "bg-sky-100 text-sky-800",
  COMPLETED: "bg-zinc-100 text-zinc-700",
  DECLINED: "bg-red-100 text-red-700",
  CANCELLED: "bg-orange-100 text-orange-800",
};

const badgeClasses = "inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium whitespace-nowrap";

export function InquiryStatusBadge({ status }: { status: InquiryStatus }) {
  return <span className={`${badgeClasses} ${INQUIRY_STYLES[status]}`}>{INQUIRY_STATUS_LABELS[status]}</span>;
}

export function VisitStatusBadge({ status }: { status: VisitRequestStatus }) {
  return <span className={`${badgeClasses} ${VISIT_STYLES[status]}`}>{VISIT_REQUEST_STATUS_LABELS[status]}</span>;
}
