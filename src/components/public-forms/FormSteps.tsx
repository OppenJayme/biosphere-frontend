import { CheckIcon } from "@/components/icons";

/**
 * Where the visitor is in a multi-step form: numbered circles, each centred over its step name in
 * an equal column, joined by lines. Finished steps can be clicked to go back; later steps open only
 * through Next, which checks the current step first.
 */
export function FormSteps({
  steps,
  current,
  onBack,
}: {
  steps: readonly { title: string }[];
  current: number;
  onBack: (step: number) => void;
}) {
  return (
    <nav aria-label="Form progress">
      <p className="sr-only">
        Step {current + 1} of {steps.length}: {steps[current]?.title}
      </p>
      <ol className="grid" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
        {steps.map((step, index) => {
          const done = index < current;
          const active = index === current;
          const content = (
            <>
              <span
                className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                  active
                    ? "bg-brand-solid text-white ring-4 ring-brand-soft"
                    : done
                      ? "bg-brand-soft text-brand"
                      : "border border-forest-900/20 bg-surface text-ink-muted"
                }`}
              >
                {done ? <CheckIcon className="h-4 w-4" aria-hidden="true" /> : index + 1}
              </span>
              <span
                className={`mt-1.5 text-xs leading-tight group-hover:underline sm:text-sm ${active ? "font-semibold text-ink" : "text-ink-muted"}`}
              >
                {step.title}
              </span>
            </>
          );
          return (
            <li
              key={step.title}
              className="relative flex flex-col items-center px-1 text-center"
              aria-current={active ? "step" : undefined}
            >
              {/* The line from the previous circle's centre to this one's; the circles cover its ends. */}
              {index > 0 && (
                <span
                  aria-hidden="true"
                  className={`absolute right-1/2 top-4 h-0.5 w-full -translate-y-1/2 ${
                    index <= current ? "bg-brand-solid/40" : "bg-forest-900/10"
                  }`}
                />
              )}
              {done ? (
                <button
                  type="button"
                  onClick={() => onBack(index)}
                  aria-label={`Back to step ${index + 1}: ${step.title}`}
                  className="group flex flex-col items-center rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                >
                  {content}
                </button>
              ) : (
                content
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
