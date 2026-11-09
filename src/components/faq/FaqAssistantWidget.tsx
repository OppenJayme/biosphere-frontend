/**
 * Public museum assistant (SRS 3.1.6, 4.11). Shows curator-approved answers, or, when the backend's
 * optional AI layer is on, AI wording that is labelled and names its approved sources. It always
 * discloses its limits and keeps a visible path to the General Inquiry form. The conversation and
 * up to four earlier questions stay in memory only; New chat clears them. A separate, feature-gated
 * form can submit one explicitly consented unanswered question, never the conversation.
 *
 * The limits notice can be closed, but an info button in the header brings it back, and any change
 * to its wording shows it again (REQ-4.11-10). Replies are typed out visually; screen readers get
 * each reply's full text at once, and reduced-motion visitors see it without animation.
 */

"use client";

import Link from "next/link";
import { FaqReviewConsent } from "./FaqReviewConsent";
import { useTypewriter } from "./useTypewriter";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import {
  ArrowRightIcon,
  ChatIcon,
  ChevronDownIcon,
  CloseIcon,
  InfoIcon,
  LeafIcon,
  RotateCcwIcon,
} from "@/components/icons";
import {
  FAQ_DEFAULT_NOTICE,
  FAQ_HISTORY_LIMIT,
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
      kind: "answer" | "clarification" | "fallback" | "error" | "chat";
      text: string;
      answeredQuestion?: string;
      /** AI-assisted wording; `sources` are the approved FAQs it was based on. */
      assisted?: boolean;
      sources?: PublicFaqQuestion[];
      reviewQuestion?: string;
      related: PublicFaqQuestion[];
      redirect: FaqAssistantRedirect | null;
      /** Set once the reply has been typed out, so reopening the panel doesn't type it again. */
      typed?: boolean;
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
  // The wording the visitor closed; a different notice from the backend shows again.
  const [dismissedNotice, setDismissedNotice] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const nextId = useRef(0);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const noticeCloseRef = useRef<HTMLButtonElement>(null);
  const noticeShowRef = useRef<HTMLButtonElement>(null);
  // Set when the visitor toggles the notice, so focus follows to the control that replaces it.
  const focusNoticeControl = useRef(false);
  const noticeVisible = notice !== dismissedNotice;
  // One public topic hint in component memory only, never a chat-history export.
  const lastAnsweredFaqId = useRef<string | undefined>(undefined);
  // Earlier visitor questions in this open chat, sent only to interpret follow-ups.
  const recentQuestions = useRef<string[]>([]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, pending]);

  useEffect(() => {
    if (!focusNoticeControl.current) return;
    focusNoticeControl.current = false;
    (noticeVisible ? noticeCloseRef : noticeShowRef).current?.focus();
  }, [noticeVisible]);

  if (HIDDEN_PATH_PREFIXES.some((prefix) => pathname?.startsWith(prefix))) return null;

  function toggleNotice(show: boolean) {
    focusNoticeControl.current = true;
    setDismissedNotice(show ? null : notice);
  }

  // Follows a reply as it types, unless the visitor has scrolled up to reread something.
  function followTyping() {
    const log = logRef.current;
    if (log && log.scrollHeight - log.scrollTop - log.clientHeight < 80) {
      log.scrollTop = log.scrollHeight;
    }
  }

  function markTyped(id: number) {
    setMessages((current) =>
      current.some((message) => message.id === id && message.from === "assistant" && !message.typed)
        ? current.map((message) => (message.id === id ? { ...message, typed: true } : message))
        : current,
    );
  }

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
    recentQuestions.current = [];
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
    const history = [...recentQuestions.current];
    const result = await askFaqAssistant(question, selectedFaqId, contextFaqId, history);
    if (!result.ok || result.data.outcome !== "SMALL_TALK") {
      recentQuestions.current = [...history, question].slice(-FAQ_HISTORY_LIMIT);
    }
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
      reply = data.outcome === "SMALL_TALK"
        ? {
            id: nextId.current++,
            from: "assistant",
            kind: "chat",
            text: data.message ?? "",
            related: data.related,
            redirect: null,
          }
        : data.answer
        ? {
            id: nextId.current++,
            from: "assistant",
            kind: "answer",
            text: data.answer.answer,
            answeredQuestion: data.assisted ? undefined : data.answer.question,
            assisted: data.assisted,
            sources: data.sources,
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
            {!noticeVisible && (
              <button
                ref={noticeShowRef}
                type="button"
                onClick={() => toggleNotice(true)}
                aria-label="Show what the assistant can answer"
                title="About these answers"
                className="rounded-full p-1.5 hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <InfoIcon className="h-5 w-5" />
              </button>
            )}
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

          {noticeVisible && (
            <div className="flex items-start gap-2 border-b border-line bg-brand-soft py-2.5 pr-2 pl-4 text-xs leading-relaxed text-ink-muted">
              <InfoIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
              <p className="flex-1">{notice}</p>
              <button
                ref={noticeCloseRef}
                type="button"
                onClick={() => toggleNotice(false)}
                aria-label="Hide this notice"
                title="Hide"
                className="-mt-0.5 shrink-0 rounded-full p-1 text-ink-muted hover:bg-brand/10 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                <CloseIcon className="h-4 w-4" />
              </button>
            </div>
          )}

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
                  className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-sm bg-brand-solid px-3.5 py-2 whitespace-pre-wrap text-white motion-safe:animate-[faq-bubble-in_0.2s_ease-out]"
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
                  onTyping={followTyping}
                  onTyped={() => markTyped(message.id)}
                />
              ),
            )}

            {pending && (
              <AssistantBubble>
                <span className="sr-only">Checking approved answers…</span>
                <TypingDots />
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
    <div className="w-fit max-w-[90%] rounded-2xl rounded-bl-sm bg-paper px-3.5 py-2.5 leading-relaxed text-ink motion-safe:animate-[faq-bubble-in_0.2s_ease-out]">
      {children}
    </div>
  );
}

/** Three bouncing dots while a reply is on its way; they hold still under reduced motion. */
function TypingDots() {
  return (
    <span aria-hidden="true" className="flex h-5 items-center gap-1">
      {[0, 1, 2].map((dot) => (
        <span
          key={dot}
          style={{ animationDelay: `${dot * 160}ms` }}
          className="h-1.5 w-1.5 rounded-full bg-ink-muted motion-safe:animate-[faq-typing-dot_1s_ease-in-out_infinite]"
        />
      ))}
    </span>
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
  onTyping,
  onTyped,
}: {
  message: Extract<Message, { from: "assistant" }>;
  disabled: boolean;
  onAsk: (question: PublicFaqQuestion) => void;
  onNavigate: () => void;
  onTyping: () => void;
  onTyped: () => void;
}) {
  const redirect = message.redirect ? FAQ_REDIRECTS[message.redirect] : null;
  const { visible, done } = useTypewriter(message.text, !message.typed, { onProgress: onTyping, onDone: onTyped });

  return (
    <div className="space-y-2">
      <AssistantBubble>
        <span className="sr-only">Assistant: </span>
        {message.assisted && (
          <span className="mb-1 block text-xs font-semibold text-brand">AI-assisted wording from approved FAQs</span>
        )}
        {message.answeredQuestion && (
          <span className="mb-1 block text-xs font-semibold text-brand">{message.answeredQuestion}</span>
        )}
        {/* The live region reads the full reply once; the typed copy is visual only. */}
        <span className="sr-only">{message.text}</span>
        <span aria-hidden="true" className={`whitespace-pre-wrap ${message.kind === "error" ? "text-ink-muted" : ""}`}>
          {visible}
          {!done && (
            <span className="ml-0.5 inline-block h-3.5 w-0.5 translate-y-0.5 bg-brand motion-safe:animate-pulse" />
          )}
        </span>
        {done && redirect && (
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
      {/* Follow-ups appear once the reply has finished typing. */}
      {done && message.assisted && message.sources && message.sources.length > 0 && (
        <div className="pl-1">
          <p className="mb-1.5 text-xs text-ink-muted">Based on (tap for the exact approved answer)</p>
          <QuestionChips questions={message.sources} disabled={disabled} onPick={onAsk} />
        </div>
      )}
      {done && message.reviewQuestion && <FaqReviewConsent question={message.reviewQuestion} />}
      {done && message.related.length > 0 && (
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
