import { CheckIcon } from "@/components/icons";

/**
 * Where the visitor is in a multi-step form. Finished steps can be clicked to go back; later steps
 * open only through Next, which checks the current step first. Phones show the current step's
 * name only, with the bar showing progress.
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
      <p className="text-xs font-medium text-ink-muted sm:sr-only">
        Step {current + 1} of {steps.length}: <span className="text-ink">{steps[current]?.title}</span>
      </p>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-brand-soft sm:hidden" aria-hidden="true">
        <div
          className="h-full rounded-full bg-brand-solid transition-[width] duration-300 motion-reduce:transition-none"
          style={{ width: `${((current + 1) / steps.length) * 100}%` }}
        />
      </div>
      <ol className="hidden items-center gap-2 sm:flex">
        {steps.map((step, index) => {
          const done = index < current;
          const active = index === current;
          const marker = (
            <>
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                  active
                    ? "bg-brand-solid text-white"
                    : done
                      ? "bg-brand-soft text-brand"
                      : "border border-forest-900/20 text-ink-muted"
                }`}
              >
                {done ? <CheckIcon className="h-3.5 w-3.5" aria-hidden="true" /> : index + 1}
              </span>
              <span className={`text-sm ${active ? "font-semibold text-ink" : "text-ink-muted"}`}>{step.title}</span>
            </>
          );
          return (
            <li key={step.title} className="flex min-w-0 flex-1 items-center gap-2" aria-current={active ? "step" : undefined}>
              {done ? (
                <button
                  type="button"
                  onClick={() => onBack(index)}
                  aria-label={`Back to step ${index + 1}: ${step.title}`}
                  className="flex items-center gap-2 rounded-full pr-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                >
                  {marker}
                </button>
              ) : (
                <span className="flex items-center gap-2">{marker}</span>
              )}
              {index < steps.length - 1 && <span aria-hidden="true" className="h-px flex-1 bg-forest-900/15" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
