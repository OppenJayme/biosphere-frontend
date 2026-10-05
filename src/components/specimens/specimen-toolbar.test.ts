/** Checks form identity and defaults; actual browser navigation is a manual retest. */
import { Children, isValidElement, type ReactElement, type ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { SpecimenToolbar } from "./SpecimenToolbar";
import { parseSpecimenListQuery, type SpecimenListQuery } from "../../features/specimens/types";

type ControlProps = {
  children?: ReactNode;
  name?: string;
  defaultValue?: string;
  open?: boolean;
  href?: string;
};

function elements(node: ReactNode): ReactElement<ControlProps>[] {
  return Children.toArray(node).flatMap((child) => {
    if (!isValidElement<ControlProps>(child)) return [];
    return [child, ...elements(child.props.children)];
  });
}

function toolbar(query: SpecimenListQuery, collectionLookupAvailable = true) {
  const tree = SpecimenToolbar({
    query,
    collections: [],
    collectionLookupAvailable,
    storageOptions: [],
    storageLookupAvailable: true,
    filterError: null,
  });
  const nodes = elements(tree);
  const form = nodes.find((node) => node.type === "form")!;
  const controls = Object.fromEntries(
    nodes
      .filter((node) => node.type === "input" || node.type === "select")
      .map((node) => [node.props.name, node.props.defaultValue]),
  );
  return { form, nodes, controls };
}

const filtered = parseSpecimenListQuery({
  search: "eagle",
  status: "CATALOGED",
  gender: "MALE",
  collectionId: "11111111-1111-4111-8111-111111111111",
  specimenCategory: "Bird",
  publicDisplay: "false",
  family: "Accipitridae",
  storageUnitId: "22222222-2222-4222-8222-222222222222",
  includeDescendantUnits: "false",
  tag: "Acceptance",
  createdFrom: "2026-01-01",
  createdTo: "2026-10-01",
  sortBy: "commonName",
  sortDirection: "asc",
  page: "2",
});

describe("Cataloging filter reset", () => {
  it("changes form identity on clear and restores every control to query defaults", () => {
    const before = toolbar(filtered);
    const clearedQuery = parseSpecimenListQuery({});
    const cleared = toolbar(clearedQuery);
    expect(before.form.key).not.toBe(cleared.form.key);
    expect(before.controls.status).toBe("CATALOGED");
    expect(before.nodes.some((node) => node.props.href === "/specimens")).toBe(true);
    for (const [name, value] of Object.entries(cleared.controls)) {
      const expected = clearedQuery[name as keyof SpecimenListQuery];
      expect(value).toBe(expected === null ? "" : String(expected));
    }
    expect(cleared.nodes.find((node) => node.type === "details")?.props.open).toBe(false);
    expect(cleared.nodes.some((node) => node.props.href === "/specimens")).toBe(false);
    expect(clearedQuery.page).toBe(1);
  });

  it("restores applied filters on Back and keeps the same form on unrelated rerenders", () => {
    expect(toolbar(filtered).form.key).toBe(toolbar({ ...filtered }).form.key);
    expect(toolbar(filtered).form.key).toBe(toolbar(filtered, false).form.key);
    expect(toolbar(parseSpecimenListQuery({})).form.key).not.toBe(toolbar(filtered).form.key);
    expect(toolbar(filtered).controls.family).toBe("Accipitridae");
    expect(toolbar(filtered).controls.publicDisplay).toBe("false");
  });

  it("resets for each supported query field, including descendant scope without a location", () => {
    const defaults = parseSpecimenListQuery({});
    for (const name of Object.keys(filtered) as (keyof SpecimenListQuery)[]) {
      if (filtered[name] === defaults[name]) continue;
      const changed = { ...defaults, [name]: filtered[name] };
      expect(toolbar(changed).form.key, name).not.toBe(toolbar(defaults).form.key);
    }
  });
});
