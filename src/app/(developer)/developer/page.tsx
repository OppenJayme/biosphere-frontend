import type { Metadata } from "next";
import { ArAssetDeployment } from "@/components/developer/ArAssetDeployment";
import { CuratorAccountAdmin } from "@/components/developer/CuratorAccountAdmin";
import { listArExhibits, listCuratorAccounts } from "@/features/developer/api";
import type { ArExhibit, CuratorAccount } from "@/features/developer/types";

export const metadata: Metadata = {
  title: "Developer Interface",
};

export default async function DeveloperPage() {
  const [curators, exhibits] = await Promise.all([
    listCuratorAccounts().catch((): CuratorAccount[] | null => null),
    listArExhibits().catch((): ArExhibit[] | null => null),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-forest-800">Developer interface</h1>
        <p className="mt-1 max-w-3xl text-sm text-zinc-600">
          Restricted technical functions only: provisioning curator accounts, formally authorized
          access changes, and deploying approved AR assets. Every action here is recorded in the
          protected audit log.
        </p>
      </div>

      <CuratorAccountAdmin curators={curators} />
      <ArAssetDeployment exhibits={exhibits} />
    </div>
  );
}
