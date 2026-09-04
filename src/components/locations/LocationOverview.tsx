import { RoomOverview } from "./RoomOverview";
import { CabinetOverview } from "./CabinetOverview";
import { DrawerOverview } from "./DrawerOverview";
import { GenericOverview } from "./GenericOverview";
import type { LocationNode } from "@/lib/dummy-data/locations";

export function LocationOverview({ node, onOpen }: { node: LocationNode; onOpen: (id: string) => void }) {
  switch (node.unitType) {
    case "Room":
      return <RoomOverview room={node} onOpen={onOpen} />;
    case "Cabinet":
      return <CabinetOverview cabinet={node} onOpen={onOpen} />;
    case "Drawer":
      return <DrawerOverview drawer={node} />;
    default:
      return <GenericOverview node={node} onOpen={onOpen} />;
  }
}
