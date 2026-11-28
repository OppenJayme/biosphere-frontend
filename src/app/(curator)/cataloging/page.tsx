/**
 * The Cataloging tab was removed (panel recommendation, 2026-11-28): Specimens now opens on
 * Uncataloged records. This keeps old bookmarks and links working.
 */

import { redirect } from "next/navigation";

export default function CatalogingRedirect() {
  redirect("/specimens?status=UNCATALOGED");
}
