import type { Metadata } from "next";
import { ArAssetDeployment } from "@/components/developer/ArAssetDeployment";
import {
  CuratorAccountsPanel,
  CuratorHandoverPanel,
  InviteCuratorButton,
} from "@/components/developer/CuratorAccountAdmin";
import { StatCard } from "@/components/ui/StatCard";
import { listArExhibits, listCuratorAccounts } from "@/features/developer/api";
import type { ArExhibit, CuratorAccount } from "@/features/developer/types";

export const metadata: Metadata = {
  title: "Developer Interface",
};

/** Summary counts for the stat row; "—" when a list could not be loaded. */
function summarize(curators: CuratorAccount[] | null, exhibits: ArExhibit[] | null) {
  const count = <T,>(list: T[] | null, test: (item: T) => boolean) =>
    list === null ? "—" : String(list.filter(test).length);
  const deployable = (exhibit: ArExhibit) => exhibit.deployable;
  return {
    active: count(curators, (curator) => curator.status === "ACTIVE" && curator.inviteAccepted),
    pending: count(curators, (curator) => curator.status === "ACTIVE" && !curator.inviteAccepted),
    arExhibits: count(exhibits, deployable),
    missingGlb: count(
      exhibits,
      (exhibit) => deployable(exhibit) && !exhibit.assets.some((asset) => asset.modelFormat === "glb" && asset.isEnabled),
    ),
  };
}

export default async function DeveloperPage() {
  const [curators, exhibits] = await Promise.all([
    listCuratorAccounts().catch((): CuratorAccount[] | null => null),
    listArExhibits().catch((): ArExhibit[] | null => null),
  ]);
  const stats = summarize(curators, exhibits);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-forest-800">Developer interface</h1>
          <p className="mt-1 max-w-3xl text-sm text-zinc-600">
            Restricted technical functions only: provisioning curator accounts, formally authorized access changes,
            and deploying approved AR assets. Every action here is recorded in the protected audit log.
          </p>
        </div>
        <InviteCuratorButton curators={curators} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active curators" value={stats.active} note="Signed in at least once" tone="neutral" icon="shield" />
        <StatCard
          label="Pending invites"
          value={stats.pending}
          note="Waiting for a password"
          tone={stats.pending === "0" ? "neutral" : "warning"}
          icon="mail"
        />
        <StatCard label="AR exhibits" value={stats.arExhibits} note="Marked for AR by the curator" tone="neutral" icon="ar" />
        <StatCard
          label="No active GLB"
          value={stats.missingGlb}
          note="Not viewable on Android or desktop"
          tone={stats.missingGlb === "0" ? "positive" : "warning"}
          icon="cube"
        />
      </div>

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <CuratorAccountsPanel curators={curators} />
        <CuratorHandoverPanel curators={curators} />
      </div>

      <ArAssetDeployment exhibits={exhibits} />
    </div>
  );
}
