import type { ReactNode } from "react";

/**
 * The one header every dashboard page uses.
 *
 * Before this, each page rolled its own: products centred its title on
 * mobile, orders rendered a bare <h1> with no description slot, analytics
 * put its period switcher in a flex row of its own, and blocks stacked a
 * different way again. Same information, four layouts — so the pages felt
 * unrelated and each new page had to re-decide the arrangement.
 *
 * Layout: on mobile the title block and the actions stack, with actions
 * full-width so a primary button is easy to hit; from `sm` up the title
 * sits at the start and actions at the end of a single row. Actions wrap
 * rather than overflow, which is what kept the products page from scrolling
 * sideways at 320px.
 */
export function PageHeader({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  /** One line of context under the title — a count, a total, a hint. */
  description?: ReactNode;
  /** Buttons / share controls. Rendered at the end of the row on desktop. */
  actions?: ReactNode;
  /** Secondary row under the header: tabs, filters, period switchers. */
  children?: ReactNode;
}) {
  return (
    <header className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-black text-gray-900 dark:text-white">{title}</h1>
          {description && (
            <p className="text-sm text-muted mt-0.5">{description}</p>
          )}
        </div>
        {actions && (
          <div className="w-full sm:w-auto flex flex-wrap items-center gap-2 sm:justify-end shrink-0">
            {actions}
          </div>
        )}
      </div>
      {children}
    </header>
  );
}

/**
 * Horizontal tab/filter strip for the header's secondary row. Kept here so
 * orders' status tabs and analytics' period switcher stop being two
 * separately-styled implementations of the same control.
 */
export function PageTabs<T extends string | number>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  /** Names the group for screen readers, e.g. "وضعیت سفارش". */
  label: string;
}) {
  return (
    <div role="tablist" aria-label={label}
      className="flex gap-1 p-1 bg-gray-100 dark:bg-white/5 rounded-xl w-full sm:w-fit overflow-x-auto scrollbar-hide">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={String(o.value)}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={`shrink-0 flex-1 sm:flex-none min-h-[var(--tap-target)] px-4 rounded-lg text-sm font-medium transition-all
                        ${active
                          ? "bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm"
                          : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"}`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
