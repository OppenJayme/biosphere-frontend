import { WorkspaceLoading } from "@/components/curator/WorkspaceLoading";

// Shown inside the curator layout (sidebar and topbar stay) while this route loads.
export default function Loading() {
  return <WorkspaceLoading label="Loading specimens…" />;
}
