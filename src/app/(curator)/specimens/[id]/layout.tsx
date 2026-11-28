/**
 * Adds the `modal` slot to specimen pages: edit links opened from the details page show their
 * form in a dialog over it (panel recommendation, 2026-11-28) instead of leaving the page.
 * A direct visit or refresh still renders the full edit page.
 */

export default function SpecimenLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  return (
    <>
      {children}
      {modal}
    </>
  );
}
