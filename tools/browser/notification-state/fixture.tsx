import { createRoot } from "react-dom/client";
import { NotificationBell } from "../../../src/components/curator/NotificationBell";
import { NotificationFeedProvider } from "../../../src/features/notifications/notification-feed";
// A fixture owner with no offline drafts, so only the mocked backend feed is shown.
// The bell reads the feed it shares with the sidebar badges, so it needs the provider.
createRoot(document.getElementById("root")!).render(
  <NotificationFeedProvider>
    <NotificationBell ownerId="notifications-fixture-owner" />
  </NotificationFeedProvider>,
);
