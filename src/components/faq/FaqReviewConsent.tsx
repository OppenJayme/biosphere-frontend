"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { fetchReviewPolicy, submitReviewQuestion } from "@/features/faq/review";

/** Fail closed: no offer until the backend explicitly advertises the verified feature as enabled. */
export function FaqReviewConsent({ question }: { question: string }) {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    let active = true;
    void fetchReviewPolicy().then(policy => { if (active) setEnabled(policy?.enabled === true); });
    return () => { active = false; };
  }, []);
  return enabled ? <ReviewConsentForm question={question} /> : null;
}

export function ReviewConsentForm({ question }: { question: string }) {
  const id = useId();
  const [text, setText] = useState(question);
  const [consent, setConsent] = useState(false);
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);
  const [message, setMessage] = useState("");
  const receipt = useRef<{ question: string; id: string } | null>(null);
  const busy = useRef(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const approved = text.trim();
    if (busy.current || !consent || !approved || approved.length > 500) return;
    busy.current = true;
    setPending(true);
    try {
      // In-memory token survives a failed request; changing the approved text is a new submission.
      if (!receipt.current || receipt.current.question !== approved) receipt.current = { question: approved, id: crypto.randomUUID() };
      const result = await submitReviewQuestion(approved, receipt.current.id);
      if (result.ok) setSaved(true);
      else setMessage(result.message);
    } catch { setMessage("Submission could not be confirmed. Retry this same question."); }
    finally { busy.current = false; setPending(false); }
  }
  if (saved) return <p role="status" className="text-xs text-brand">Submitted for curator review. This does not publish an answer or promise a personal reply.</p>;
  return (
    <form onSubmit={submit} className="space-y-2 rounded-lg border border-line p-3 text-xs">
      <p className="font-semibold">Help improve approved answers (optional)</p>
      <p>Do not include names, contact details, account information or other personal details. Only this question is submitted, not your conversation. No personal reply is promised.</p>
      <p>Review access expires after 30 days from the first grouped submission; scheduled deletion and backup retention follow museum policy. Repeated submissions do not extend that deadline.</p>
      <label htmlFor={`${id}-question`} className="block font-medium">Question for curator review</label>
      <textarea id={`${id}-question`} value={text} maxLength={500} required disabled={pending} onChange={event => { setText(event.target.value); setConsent(false); setMessage(""); }} className="w-full rounded border border-line p-2" />
      <label className="flex items-start gap-2"><input type="checkbox" checked={consent} disabled={pending} onChange={event => setConsent(event.target.checked)} />I agree to submit this question for curator review under the retention notice above.</label>
      <p>Retry without editing if confirmation fails. Editing starts a separate submission. This form is not saved if you reload or leave.</p>
      {message && <p role="alert" className="text-red-700">{message}</p>}
      <button type="submit" disabled={pending || !consent || !text.trim()} className="rounded bg-brand-solid px-3 py-2 font-semibold text-white hover:bg-brand-solid-hover disabled:opacity-50">{pending ? "Submitting…" : "Submit for curator review"}</button>
    </form>
  );
}
