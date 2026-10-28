"use client";
import { useState } from "react";
import { useRef } from "react";
import { changeReviewQuestion } from "@/features/faq/review-actions";
import type { ReviewItem } from "@/features/faq/review-api";

export function FaqReviewItem({ item }: { item: ReviewItem }) {
  const [confirm, setConfirm] = useState(false);
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
      if (!result.ok) setMessage(result.message);
      else if (command === "REMOVE") setRemoved(true);
      else { setStatus(command); setMessage("Review status saved. No FAQ was published."); }
    } catch { setMessage("Change could not be confirmed. Reload to check the current state before retrying."); }
    finally { busy.current = false; setPending(false); }
  }
  if (removed) return <p role="status" className="text-sm">Question removed. Existing backup retention is unchanged.</p>;
  return <article className="space-y-3 rounded-xl border border-zinc-200 bg-white p-4">
    <p className="whitespace-pre-wrap break-words text-sm">{item.question}</p>
    <p className="text-xs text-zinc-600">{status} · {item.repeatCount} submissions</p>
    <dl className="grid gap-1 text-xs text-zinc-600"><div><dt className="inline">First submitted: </dt><dd className="inline">{item.firstSubmittedAt}</dd></div><div><dt className="inline">Last submitted: </dt><dd className="inline">{item.lastSubmittedAt}</dd></div><div><dt className="inline">Review access expires: </dt><dd className="inline">{item.expiresAt}</dd></div></dl>
    <div className="flex flex-wrap gap-2">
      <button className="rounded border px-3 py-2 text-sm hover:bg-zinc-100 disabled:opacity-50" disabled={pending || status === "REVIEWED"} type="button" onClick={() => void change("REVIEWED")}>Mark reviewed</button>
      <button className="rounded border px-3 py-2 text-sm hover:bg-zinc-100 disabled:opacity-50" disabled={pending || status === "DISMISSED"} type="button" onClick={() => void change("DISMISSED")}>Dismiss</button>
      <button className="rounded border px-3 py-2 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50" disabled={pending} type="button" onClick={() => setConfirm(!confirm)}>Remove permanently</button>
    </div>
    {confirm && <div className="space-y-2 rounded border border-red-200 p-3"><p>Permanently remove this question and retry receipts? This does not erase existing backups.</p><button disabled={pending} className="rounded bg-red-700 px-3 py-2 text-sm text-white hover:bg-red-800 disabled:opacity-50" type="button" onClick={() => void change("REMOVE")}>Confirm removal</button><button disabled={pending} type="button" className="ml-3 underline" onClick={() => setConfirm(false)}>Cancel</button></div>}
    {pending && <p role="status">Saving review change…</p>}
    {message && <p role="status" className="text-sm">{message}</p>}
  </article>;
}
