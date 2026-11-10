import { createRoot } from "react-dom/client";
import { NotificationBell } from "../../../src/components/curator/NotificationBell";
// A fixture owner with no offline drafts, so only the mocked backend feed is shown.
createRoot(document.getElementById("root")!).render(<NotificationBell ownerId="notifications-fixture-owner" />);
