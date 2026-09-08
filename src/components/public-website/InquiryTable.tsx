"use client";

import { InquiryStatusBadge, VisitStatusBadge } from "./StatusBadge";
import type { Inquiry, VisitRequest } from "@/lib/dummy-data/public-website";

export function InquiryTable({
  items,
  selectedId,
  onSelect,
}: {
  items: (Inquiry | VisitRequest)[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px] text-left text-sm">
        <thead>
          <tr className="border-b border-black/10 text-xs text-zinc-500">
            <th className="py-2 pr-3 font-medium">Timestamp</th>
            <th className="py-2 pr-3 font-medium">Sender</th>
            <th className="py-2 pr-3 font-medium">Subject</th>
            <th className="py-2 pr-3 font-medium">Message Preview</th>
            <th className="py-2 pr-0 font-medium">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-black/5">
          {items.map((item) => {
            const selected = item.id === selectedId;
            return (
              <tr
                key={item.id}
                onClick={() => onSelect(item.id)}
                className={`cursor-pointer border-l-4 transition-colors ${
                  selected ? "border-forest-600 bg-forest-50" : "border-transparent hover:bg-sage-50"
                }`}
              >
                <td className="py-2.5 pr-3 whitespace-nowrap text-zinc-600">{item.timestamp}</td>
                <td className="py-2.5 pr-3">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white ${item.sender.color}`}
                    >
                      {item.sender.initials}
                    </span>
                    <span className="whitespace-nowrap font-medium text-zinc-800">{item.sender.name}</span>
                  </div>
                </td>
                <td className="py-2.5 pr-3 whitespace-nowrap text-zinc-700">{item.subject}</td>
                <td className="max-w-[280px] truncate py-2.5 pr-3 text-zinc-600">{item.messagePreview}</td>
                <td className="py-2.5 pr-0">
                  {item.kind === "inquiry" ? (
                    <InquiryStatusBadge status={item.status} />
                  ) : (
                    <VisitStatusBadge status={item.status} />
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
