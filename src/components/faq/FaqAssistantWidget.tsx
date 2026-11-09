/**
 * Public Controlled Knowledge-Based FAQ Assistant (SRS 3.1.6, 4.11). Shows only curator-approved
 * answers returned by the backend, always discloses that limit, and keeps a visible path to the
 * General Inquiry form. Conversation remains in memory; a separate, feature-gated form can submit
 * one explicitly consented unanswered question, never the conversation (REQ-4.11-07).
 */

"use client";

import Link from "next/link";
import { FaqReviewConsent } from "./FaqReviewConsent";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import {
  ArrowRightIcon,
  ChatIcon,
  ChevronDownIcon,
  InfoIcon,
  LeafIcon,
  RotateCcwIcon,
} from "@/components/icons";
import {
  FAQ_DEFAULT_NOTICE,
  FAQ_QUESTION_MAX_LENGTH,
  FAQ_REDIRECTS,
  askFaqAssistant,
  fetchFaqSuggestions,
  isFaqFollowup,
  normalizeVisitorQuestion,
  type FaqAssistantRedirect,
  type PublicFaqQuestion,
} from "@/features/faq/assistant";

type Message =
  | { id: number; from: "visitor"; text: string }
  | {
      id: number;
      from: "assistant";
      kind: "answer" | "clarification" | "fallback" | "error";
      text: string;
      answeredQuestion?: string;
      reviewQuestion?: string;
      related: PublicFaqQuestion[];
      redirect: FaqAssistantRedirect | null;
    };

type SuggestionState =
  | { status: "idle" | "loading" }
  | { status: "ready"; items: PublicFaqQuestion[] }
  | { status: "error" };

// QR exhibit pages have their own fixed action bar and a focused, unlisted purpose.
const HIDDEN_PATH_PREFIXES = ["/exhibits"];

export function FaqAssistantWidget() {
  const pathname = usePathname();
  const panelId = useId();
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [suggestions, setSuggestions] = useState<SuggestionState>({ status: "idle" });
  const [notice, setNotice] = useState(FAQ_DEFAULT_NOTICE);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const nextId = useRef(0);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  // One public topic hint in component memory only, never a chat-history export.
  const lastAnsweredFaqId = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, pending]);

  if (HIDDEN_PATH_PREFIXES.some((prefix) => pathname?.startsWith(prefix))) return null;

  function openPanel() {
    setOpen(true);
    // Load once per page visit; a failed load retries the next time the panel opens.
    if (suggestions.status === "loading" || suggestions.status === "ready") return;
    setSuggestions({ status: "loading" });
    void fetchFaqSuggestions().then((result) => {
      if (result.ok) {
        setSuggestions({ status: "ready", items: result.data.items });
        setNotice(result.data.notice);
      } else {
        setSuggestions({ status: "error" });
      }
    });
  }

  function minimize() {
    setOpen(false);
    launcherRef.current?.focus();
  }

  // Clears the in-memory conversation and its topic hint; nothing is stored elsewhere.
  function startNewChat() {
    if (pending) return;
    setMessages([]);
    setDraft("");
    lastAnsweredFaqId.current = undefined;
    inputRef.current?.focus();
  }

  async function ask(rawQuestion: string, selectedFaqId?: string) {
    const question = normalizeVisitorQuestion(rawQuestion);
    if (!question || pending) return;

    setDraft("");
    setPending(true);
    setMessages((current) => [...current, { id: nextId.current++, from: "visitor", text: question }]);

    const contextFaqId = !selectedFaqId && isFaqFollowup(question)
      ? lastAnsweredFaqId.current
      : undefined;
    lastAnsweredFaqId.current = undefined;
    const result = await askFaqAssistant(question, selectedFaqId, contextFaqId);
    let reply: Message;
    if (!result.ok) {
      reply = {
        id: nextId.current++,
        from: "assistant",
        kind: "error",
        text: result.message,
        related: [],
        redirect: "GENERAL_INQUIRY",
      };
    } else {
      const { data } = result;
      lastAnsweredFaqId.current = data.outcome === "ANSWERED" ? data.answer?.id : undefined;
      setNotice(data.notice);
      reply = data.answer
        ? {
            id: nextId.current++,
            from: "assistant",
            kind: "answer",
            text: data.answer.answer,
            answeredQuestion: data.answer.question,
            related: data.related,
            redirect: data.redirect,
          }
        : {
            id: nextId.current++,
            from: "assistant",
            kind: data.outcome === "CLARIFICATION_NEEDED" ? "clarification" : "fallback",
            reviewQuestion: data.outcome === "NO_MATCH" ? question : undefined,
            text: data.message ?? "No approved answer is available for that question.",
            related: data.related,
            redirect: data.redirect ?? (data.outcome === "CLARIFICATION_NEEDED" ? null : "GENERAL_INQUIRY"),
          };
    }
    setMessages((current) => [...current, reply]);
    setPending(false);
    inputRef.current?.focus();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void ask(draft);
  }

  return (
    <div className="fixed right-4 bottom-4 z-30 flex flex-col items-end gap-3 sm:right-6 sm:bottom-6">
      {open && (
        <section
          id={panelId}
          role="dialog"
          aria-labelledby={titleId}
          onKeyDown={(event) => {
            if (event.key === "Escape") minimize();
          }}
          className="flex max-h-[min(38rem,calc(100dvh-10.5rem))] w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-line bg-surface text-ink shadow-xl"
        >
          <header className="flex items-center gap-3 bg-brand-solid px-4 py-3 text-white">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15">
              <LeafIcon className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 id={titleId} className="text-sm font-semibold">
                Museum Assistant
              </h2>
              <p className="text-xs text-white/80">USC Biological Museum FAQ</p>
            </div>
            {messages.length > 0 && (
              <button
                type="button"
                onClick={startNewChat}
                disabled={pending}
                aria-label="Start a new chat"
                title="New chat"
                className="rounded-full p-1.5 hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-50"
              >
                <RotateCcwIcon className="h-5 w-5" />
              </button>
            )}
            <button
              type="button"
              onClick={minimize}
              aria-label="Minimize the museum assistant"
              className="rounded-full p-1.5 hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <ChevronDownIcon className="h-5 w-5" />
            </button>
          </header>

          <p className="flex gap-2 border-b border-line bg-brand-soft px-4 py-2.5 text-xs leading-relaxed text-ink-muted">
            <InfoIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
            <span>{notice}</span>
          </p>

          <div
            ref={logRef}
            role="log"
            aria-live="polite"
            aria-busy={pending}
            className="flex-1 space-y-3 overflow-y-auto px-4 py-4 text-sm"
          >
            <AssistantBubble>
              Hello! I can answer common questions about visiting and the museum using
              curator-approved information. Pick a question below or type your own.
            </AssistantBubble>

            <Suggestions state={suggestions} disabled={pending} onPick={(item) => void ask(item.question, item.id)} />

            {messages.map((message) =>
              message.from === "visitor" ? (
                <p
                  key={message.id}
                  className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-sm bg-brand-solid px-3.5 py-2 whitespace-pre-wrap text-white"
                >
                  <span className="sr-only">You asked: </span>
                  {message.text}
                </p>
              ) : (
                <AssistantReply
                  key={message.id}
                  message={message}
                  disabled={pending}
                  onAsk={(item) => void ask(item.question, item.id)}
                  onNavigate={() => setOpen(false)}
                />
              ),
            )}

            {pending && (
              <AssistantBubble>
                <span className="text-ink-muted">Checking approved answers…</span>
              </AssistantBubble>
            )}
          </div>

          <form onSubmit={handleSubmit} className="border-t border-line px-3 pt-3 pb-2">
            <div className="flex items-center gap-2">
              <label htmlFor={`${panelId}-question`} className="sr-only">
                Ask a museum-related question
              </label>
              <input
                ref={inputRef}
                id={`${panelId}-question`}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                maxLength={FAQ_QUESTION_MAX_LENGTH}
                autoComplete="off"
                aria-describedby={`${panelId}-privacy`}
                placeholder="Ask a museum-related question"
                className="min-w-0 flex-1 rounded-full border border-line bg-paper px-4 py-2 text-sm text-ink placeholder:text-ink-muted focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
              />
              <button
                type="submit"
                disabled={pending || !normalizeVisitorQuestion(draft)}
                aria-label="Send question"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-solid text-white hover:bg-brand-solid-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:opacity-50"
              >
                <ArrowRightIcon className="h-4 w-4" />
              </button>
            </div>
            {/* Proposed wording; privacy text still needs the pending university approval. */}
            <p id={`${panelId}-privacy`} className="mt-2 text-center text-xs text-ink-muted">
              Please don&apos;t include personal details such as your name, phone number, or email.
            </p>
            <p className="mt-1 text-center text-xs text-ink-muted">
              Can&apos;t find an answer?{" "}
              <Link
                href={FAQ_REDIRECTS.GENERAL_INQUIRY.href}
                onClick={() => setOpen(false)}
                className="font-medium text-brand underline-offset-4 hover:underline"
              >
                Send a General Inquiry
              </Link>
            </p>
          </form>
        </section>
      )}

      <button
        ref={launcherRef}
        type="button"
        onClick={() => (open ? minimize() : openPanel())}
        aria-label={open ? "Minimize the museum assistant" : "Open the museum assistant"}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        className="inline-flex items-center gap-2 rounded-full bg-brand-solid px-4 py-3 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-brand-solid-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
      >
        {open ? <ChevronDownIcon className="h-5 w-5" /> : <ChatIcon className="h-5 w-5" />}
        {!open && (
          <span aria-hidden="true" className="hidden sm:inline">
            Ask the museum
          </span>
        )}
      </button>
    </div>
  );
}

function AssistantBubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-fit max-w-[90%] rounded-2xl rounded-bl-sm bg-paper px-3.5 py-2.5 leading-relaxed text-ink">
      {children}
    </div>
  );
}

function Suggestions({
  state,
  disabled,
  onPick,
}: {
  state: SuggestionState;
  disabled: boolean;
  onPick: (question: PublicFaqQuestion) => void;
}) {
  if (state.status !== "ready") {
    return state.status === "error" ? null : (
      <p className="text-xs text-ink-muted">Loading suggested questions…</p>
    );
  }
  if (state.items.length === 0) return null;

  return (
    <div>
      <p className="mb-2 text-xs font-medium text-ink-muted">Suggested questions</p>
      <QuestionChips questions={state.items} disabled={disabled} onPick={onPick} />
    </div>
  );
}

function QuestionChips({
  questions,
  disabled,
  onPick,
}: {
  questions: PublicFaqQuestion[];
  disabled: boolean;
  onPick: (question: PublicFaqQuestion) => void;
}) {
  return (
    <ul className="flex flex-wrap gap-2">
      {questions.map((item) => (
        <li key={item.id}>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onPick(item)}
            className="rounded-full border border-brand/40 px-3 py-1.5 text-left text-xs font-medium text-brand hover:bg-brand-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:opacity-50"
          >
            {item.question}
          </button>
        </li>
      ))}
    </ul>
  );
}

function AssistantReply({
  message,
  disabled,
  onAsk,
  onNavigate,
}: {
  message: Extract<Message, { from: "assistant" }>;
  disabled: boolean;
  onAsk: (question: PublicFaqQuestion) => void;
  onNavigate: () => void;
}) {
  const redirect = message.redirect ? FAQ_REDIRECTS[message.redirect] : null;

  return (
    <div className="space-y-2">
      <AssistantBubble>
        <span className="sr-only">Assistant: </span>
        {message.answeredQuestion && (
          <span className="mb-1 block text-xs font-semibold text-brand">{message.answeredQuestion}</span>
        )}
        <span className={`whitespace-pre-wrap ${message.kind === "error" ? "text-ink-muted" : ""}`}>
          {message.text}
        </span>
        {redirect && (
          <Link
            href={redirect.href}
            onClick={onNavigate}
            className="mt-2 flex w-fit items-center gap-1.5 text-xs font-semibold text-brand underline-offset-4 hover:underline"
          >
            {redirect.label}
            <ArrowRightIcon className="h-3.5 w-3.5" />
          </Link>
        )}
      </AssistantBubble>
      {message.reviewQuestion && <FaqReviewConsent question={message.reviewQuestion} />}
      {message.related.length > 0 && (
        <div className="pl-1">
          <p className="mb-1.5 text-xs text-ink-muted">
            {message.kind === "answer" ? "Related questions" : message.kind === "clarification" ? "Choose the question you meant" : "Did you mean one of these?"}
          </p>
          <QuestionChips questions={message.related} disabled={disabled} onPick={onAsk} />
        </div>
      )}
    </div>
  );
}
