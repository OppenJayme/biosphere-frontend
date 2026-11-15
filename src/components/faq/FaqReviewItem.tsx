"use client";
import { useState } from "react";
import { useRef } from "react";
import { changeReviewQuestion } from "@/features/faq/review-actions";
import type { ReviewItem } from "@/features/faq/review-api";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { notify } from "@/components/ui/toast";

export function FaqReviewItem({ item }: { item: ReviewItem }) {
  const [status, setStatus] = useState(item.status);
  const [pending, setPending] = useState(false);
  const [removed, setRemoved] = useState(false);
  const [message, setMessage] = useState("");
  const busy = useRef(false);
  async function change(command: "REVIEWED" | "DISMISSED" | "REMOVE") {
    if (busy.current) return;
    busy.current = true; setPending(true); setMessage("");
    try {
      const result = await changeReviewQuestion(item.id, command);
      if (!result.ok) { setMessage(result.message); notify("error", result.message); }
      else if (command === "REMOVE") { setRemoved(true); notify("success", "The question was removed."); }
      else { setStatus(command); setMessage("Review status saved. No FAQ was published."); notify("success", "Review status saved."); }
    } catch {
      const text = "Change could not be confirmed. Reload to check the current state before retrying.";
      setMessage(text);
      notify("error", text);
    }
    finally { busy.current = false; setPending(false); }
  }
  if (removed) return <p role="status" className="text-sm">Question removed. Existing backup retention is unchanged.</p>;
  return <article className="space-y-3 rounded-xl border border-zinc-200 bg-white p-4">
    <p className="whitespace-pre-wrap break-words text-sm">{item.question}</p>
    <p className="text-xs text-zinc-600">{status} · {item.repeatCount} submissions</p>
    <dl className="grid gap-1 text-xs text-zinc-600"><div><dt className="inline">First submitted: </dt><dd className="inline">{item.firstSubmittedAt}</dd></div><div><dt className="inline">Last submitted: </dt><dd className="inline">{item.lastSubmittedAt}</dd></div><div><dt className="inline">Review access expires: </dt><dd className="inline">{item.expiresAt}</dd></div></dl>
    <div className="flex flex-wrap gap-2">
      <ConfirmButton
        label="Mark reviewed"
        question="Mark this question as reviewed?"
        detail="Only its review status changes. No FAQ is published."
        confirmLabel="Mark reviewed"
        pending={pending}
        pendingLabel="Saving review change…"
        disabled={status === "REVIEWED"}
        onConfirm={() => void change("REVIEWED")}
        className="rounded border px-3 py-2 text-sm hover:bg-zinc-100 disabled:opacity-50"
      />
      <ConfirmButton
        label="Dismiss"
        question="Dismiss this question?"
        detail="Only its review status changes. The question is kept."
        confirmLabel="Dismiss"
        pending={pending}
        pendingLabel="Saving review change…"
        disabled={status === "DISMISSED"}
        onConfirm={() => void change("DISMISSED")}
        className="rounded border px-3 py-2 text-sm hover:bg-zinc-100 disabled:opacity-50"
      />
      <ConfirmButton
        label="Remove permanently"
        question="Permanently remove this question?"
        detail="The question and its retry receipts are removed. This cannot be undone, and it does not erase existing backups."
        confirmLabel="Remove permanently"
        tone="danger"
        pending={pending}
        pendingLabel="Removing question…"
        onConfirm={() => void change("REMOVE")}
        className="rounded border px-3 py-2 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50"
      />
    </div>
    {message && <p role="status" className="text-sm">{message}</p>}
  </article>;
}
