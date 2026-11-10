import { createRoot } from "react-dom/client";
import { OfflineSpecimenPanel } from "../../../src/features/offline/components/OfflineSpecimenPanel";

// Synthetic owner only. This origin/context never receives an application session.
createRoot(document.getElementById("root")!).render(
  <OfflineSpecimenPanel ownerId="11111111-1111-4111-8111-111111111111" />,
);
