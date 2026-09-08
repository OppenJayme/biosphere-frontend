"use client";

import { useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon, ChevronDownIcon } from "@/components/icons";
import { PublicWebsiteToolbar, type WebsiteTab } from "./PublicWebsiteToolbar";
import { InquiryTable } from "./InquiryTable";
import { InquiryDetailPanel } from "./InquiryDetailPanel";
import { INQUIRY_STATUSES, VISIT_STATUSES, type Inquiry, type VisitRequest } from "@/lib/dummy-data/public-website";

const PAGE_SIZES = ["10 / page", "25 / page", "50 / page"];

export function PublicWebsiteWorkspace({
  inquiries,
  visitRequests,
}: {
  inquiries: Inquiry[];
  visitRequests: VisitRequest[];
}) {
  const [tab, setTab] = useState<WebsiteTab>("inquiries");
  const [selectedInquiryId, setSelectedInquiryId] = useState<string | null>(inquiries[0]?.id ?? null);
  const [selectedVisitId, setSelectedVisitId] = useState<string | null>(visitRequests[0]?.id ?? null);

  const items = tab === "inquiries" ? inquiries : visitRequests;
  const selectedId = tab === "inquiries" ? selectedInquiryId : selectedVisitId;
  const onSelect = tab === "inquiries" ? setSelectedInquiryId : setSelectedVisitId;
  const selected = items.find((item) => item.id === selectedId) ?? null;
  const total = tab === "inquiries" ? 132 : 48;
  const pageCount = tab === "inquiries" ? 14 : 5;
  const statusOptions = tab === "inquiries" ? ["All Statuses", ...INQUIRY_STATUSES] : ["All Statuses", ...VISIT_STATUSES];

  return (
    <div className="space-y-4">
      <PublicWebsiteToolbar tab={tab} onTabChange={setTab} statusOptions={statusOptions} />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-4 rounded-xl border border-black/10 bg-white p-5">
          <InquiryTable items={items} selectedId={selectedId} onSelect={onSelect} />

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-black/10 pt-4 text-xs text-zinc-500">
            <p>
              Showing 1 to {items.length} of {total} records
            </p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="Previous page"
                className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 hover:bg-sage-100"
              >
                <ChevronLeftIcon className="h-3.5 w-3.5" />
              </button>
              {[1, 2, 3, 4, 5].map((page) => (
                <button
                  key={page}
                  type="button"
                  className={`flex h-7 w-7 items-center justify-center rounded-md font-medium ${
                    page === 1 ? "border border-forest-700 text-forest-700" : "text-zinc-600 hover:bg-sage-100"
                  }`}
                >
                  {page}
                </button>
              ))}
              <span className="px-1">&hellip;</span>
              <button type="button" className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-600 hover:bg-sage-100">
                {pageCount}
              </button>
              <button
                type="button"
                aria-label="Next page"
                className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 hover:bg-sage-100"
              >
                <ChevronRightIcon className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="relative">
              <select
                defaultValue={PAGE_SIZES[0]}
                className="appearance-none rounded-md border border-black/15 bg-white py-1 pl-2.5 pr-7 text-xs text-zinc-700 focus:border-forest-700 focus:outline-none"
              >
                {PAGE_SIZES.map((size) => (
                  <option key={size}>{size}</option>
                ))}
              </select>
              <ChevronDownIcon className="pointer-events-none absolute right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 text-zinc-400" />
            </div>
          </div>
        </div>

        <InquiryDetailPanel item={selected} onClear={() => onSelect(null)} />
      </div>
    </div>
  );
}
