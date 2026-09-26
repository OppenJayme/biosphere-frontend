/** Curator controls for FAQ knowledge creation, editing, approval, and archival. */

"use client";

import { useActionState } from "react";
import {
  changeFaqStatusAction,
  createFaqEntryAction,
  updateFaqEntryAction,
} from "@/features/faq/actions";
import type { FaqCommandState, FaqFormState, FaqFormValues } from "@/features/faq/management";
import type { FaqEntry } from "@/features/faq/types";

const inputClasses =
  "mt-1 w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-forest-700 focus:outline-none focus:ring-1 focus:ring-forest-700 disabled:cursor-not-allowed disabled:bg-zinc-100";

const emptyValues: FaqFormValues = {
  question: "",
  answer: "",
  alternativeWording: "",
  keywords: "",
  category: "",
};

function valuesFromEntry(entry: FaqEntry): FaqFormValues {
  return {
    question: entry.question,
    answer: entry.answer,
    alternativeWording: entry.alternativeWording.join("\n"),
    keywords: entry.keywords.join("\n"),
    category: entry.category ?? "",
  };
}

function FaqFields({ values }: { values: FaqFormValues }) {
  return (
    <div className="grid gap-3">
      <label className="text-xs font-medium text-zinc-700">
        Visitor question
        <textarea name="question" defaultValue={values.question} rows={2} required className={`${inputClasses} resize-y`} />
      </label>
      <label className="text-xs font-medium text-zinc-700">
        Approved answer
        <textarea name="answer" defaultValue={values.answer} rows={5} required className={`${inputClasses} resize-y`} />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs font-medium text-zinc-700">
          Alternative wording (one per line)
          <textarea name="alternativeWording" defaultValue={values.alternativeWording} rows={4} className={`${inputClasses} resize-y`} />
        </label>
        <label className="text-xs font-medium text-zinc-700">
          Keywords (one per line)
          <textarea name="keywords" defaultValue={values.keywords} rows={4} className={`${inputClasses} resize-y`} />
        </label>
      </div>
      <label className="text-xs font-medium text-zinc-700 sm:max-w-md">
        Category (optional)
        <input name="category" defaultValue={values.category} maxLength={100} className={inputClasses} />
      </label>
    </div>
  );
}

function FormMessage({ message }: { message?: string }) {
  return message ? <p role="alert" className="mt-3 text-xs font-medium text-red-700">{message}</p> : null;
}

function CreateFaqForm() {
  const [state, action, pending] = useActionState<FaqFormState, FormData>(createFaqEntryAction, {
    values: emptyValues,
  });

  return (
    <details className="rounded-xl border border-black/10 bg-white p-4">
      <summary className="cursor-pointer text-sm font-semibold text-forest-800">Add FAQ knowledge</summary>
      <form action={action} className="mt-4">
        <p className="mb-3 text-xs text-zinc-500">
          New entries always start inactive and require explicit curator activation before future chatbot use.
        </p>
        <FaqFields values={state.values} />
        <button type="submit" disabled={pending} className="mt-4 rounded-lg bg-forest-700 px-4 py-2 text-sm font-semibold text-white hover:bg-forest-800 disabled:cursor-not-allowed disabled:opacity-60">
          {pending ? "Creating..." : "Create inactive entry"}
        </button>
        <FormMessage message={state.message} />
      </form>
    </details>
  );
}

function EditFaqForm({ entry }: { entry: FaqEntry }) {
  const action = updateFaqEntryAction.bind(null, entry.id);
  const [state, formAction, pending] = useActionState<FaqFormState, FormData>(action, {
    values: valuesFromEntry(entry),
  });

  return (
    <details className="rounded-xl border border-black/10 bg-white p-4">
      <summary className="cursor-pointer text-sm font-semibold text-forest-800">Edit selected knowledge</summary>
      <form action={formAction} className="mt-4">
        {entry.status === "ACTIVE" && (
          <p className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950">
            This entry is active. Saved changes immediately replace its approved knowledge content.
          </p>
        )}
        <FaqFields values={state.values} />
        <button type="submit" disabled={pending} className="mt-4 rounded-lg bg-forest-700 px-4 py-2 text-sm font-semibold text-white hover:bg-forest-800 disabled:cursor-not-allowed disabled:opacity-60">
          {pending ? "Saving..." : "Save knowledge"}
        </button>
        <FormMessage message={state.message} />
      </form>
    </details>
  );
}

function LifecycleButton({
  entry,
  command,
  label,
  confirmation,
  danger = false,
}: {
  entry: FaqEntry;
  command: "activate" | "deactivate" | "archive";
  label: string;
  confirmation?: string;
  danger?: boolean;
}) {
  const action = changeFaqStatusAction.bind(null, entry.id, command);
  const [state, formAction, pending] = useActionState<FaqCommandState, FormData>(action, {});

  return (
    <div>
      <form
        action={formAction}
        onSubmit={(event) => {
          if (confirmation && !window.confirm(confirmation)) event.preventDefault();
        }}
      >
        <button
          type="submit"
          disabled={pending}
          className={`rounded-lg border px-3 py-2 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-60 ${
            danger
              ? "border-red-200 text-red-700 hover:bg-red-50"
              : "border-forest-700 text-forest-800 hover:bg-forest-50"
          }`}
        >
          {pending ? "Saving..." : label}
        </button>
      </form>
      <FormMessage message={state.message} />
    </div>
  );
}

function FaqLifecycle({ entry }: { entry: FaqEntry }) {
  if (entry.status === "ARCHIVED") {
    return <div className="rounded-xl border border-black/10 bg-zinc-50 p-4 text-sm text-zinc-600">Archived knowledge is permanently read-only through routine operations.</div>;
  }

  return (
    <section className="rounded-xl border border-black/10 bg-white p-4">
      <h3 className="text-sm font-semibold text-zinc-900">Knowledge lifecycle</h3>
      <p className="mt-1 text-xs text-zinc-600">
        Activation is the approval step. Archiving preserves history and currently cannot be reversed.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {entry.status === "INACTIVE" ? (
          <LifecycleButton
            entry={entry}
            command="activate"
            label="Activate approved knowledge"
            confirmation="Confirm that this answer is curator-approved for future public chatbot matching."
          />
        ) : (
          <LifecycleButton entry={entry} command="deactivate" label="Deactivate knowledge" />
        )}
        <LifecycleButton
          entry={entry}
          command="archive"
          label="Archive knowledge"
          danger
          confirmation="Archive this FAQ knowledge permanently? It will remain in history but cannot be restored through the current workflow."
        />
      </div>
    </section>
  );
}

export function FaqKnowledgeManagement({ selected }: { selected: FaqEntry | null }) {
  return (
    <section className="space-y-3" aria-labelledby="faq-management-heading">
      <div>
        <h2 id="faq-management-heading" className="font-serif text-lg font-semibold text-forest-800">Manage FAQ knowledge</h2>
        <p className="mt-1 text-sm text-zinc-600">Changes are validated, attributed, and audited by the protected backend.</p>
      </div>
      <CreateFaqForm />
      {selected && selected.status !== "ARCHIVED" && <EditFaqForm key={selected.id} entry={selected} />}
      {selected && <FaqLifecycle key={`${selected.id}-${selected.status}`} entry={selected} />}
    </section>
  );
}
