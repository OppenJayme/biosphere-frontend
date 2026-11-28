/** Import moved under Specimens with the Cataloging tab's removal; keeps old links working. */

import { redirect } from "next/navigation";

export default function CatalogingImportRedirect() {
  redirect("/specimens/import");
}
