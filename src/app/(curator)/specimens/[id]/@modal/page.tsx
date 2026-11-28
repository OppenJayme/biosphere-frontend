/**
 * Matches the details URL itself. Without it, a slot keeps its last state on client navigation,
 * so the dialog would stay open after a save redirects back to the details page.
 */
export default function NoModalOnDetails() {
  return null;
}
