import { describe, expect, it } from "vitest";
import type { UserAccount } from "./types";
import { buildUserStats, filterUsers, initialsOf, toAccountUser, userStatus } from "./view";

function account(overrides: Partial<UserAccount> = {}): UserAccount {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    fullName: "Maria Santos",
    email: "maria@usc.edu.ph",
    status: "ACTIVE",
    inviteAccepted: true,
    lastSignInAt: "2026-10-01T02:00:00.000Z",
    createdAt: "2026-09-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("userStatus", () => {
  it("treats a disabled account as Inactive even if the invite was never accepted", () => {
    expect(userStatus({ status: "INACTIVE", inviteAccepted: false })).toBe("Inactive");
  });

  it("shows an enabled account with an unaccepted invite as Pending Invite", () => {
    expect(userStatus({ status: "ACTIVE", inviteAccepted: false })).toBe("Pending Invite");
  });

  it("shows an enabled, accepted account as Active", () => {
    expect(userStatus({ status: "ACTIVE", inviteAccepted: true })).toBe("Active");
  });
});

describe("toAccountUser", () => {
  it("marks the signed-in user and formats dates in Philippine time", () => {
    const user = toAccountUser(account(), "11111111-1111-4111-8111-111111111111");
    expect(user.isCurrentUser).toBe(true);
    expect(user.initials).toBe("MS");
    expect(user.createdOn).toBe("Sep 1, 2026");
    expect(user.lastSignIn).toBe("Oct 1, 2026, 10:00 AM");
  });

  it("keeps a never-signed-in account's last sign-in empty", () => {
    expect(toAccountUser(account({ lastSignInAt: null }), null).lastSignIn).toBeNull();
  });
});

describe("initialsOf", () => {
  it("uses the first and last name parts", () => {
    expect(initialsOf("Dr. Juan dela Cruz")).toBe("DC");
    expect(initialsOf("Plato")).toBe("PL");
  });
});

describe("buildUserStats", () => {
  it("counts each status and its share of the total", () => {
    const users = [
      account({ id: "11111111-1111-4111-8111-111111111111" }),
      account({ id: "22222222-2222-4222-8222-222222222222", inviteAccepted: false }),
      account({ id: "33333333-3333-4333-8333-333333333333", status: "INACTIVE" }),
      account({ id: "44444444-4444-4444-8444-444444444444" }),
    ].map((item) => toAccountUser(item, null));

    const stats = buildUserStats(users);
    expect(stats.map((stat) => stat.value)).toEqual(["4", "2", "1", "1"]);
    expect(stats.map((stat) => stat.label)).toEqual([
      "Total Curators",
      "Active Curators",
      "Pending Invitations",
      "Inactive Accounts",
    ]);
    expect(stats[1].note).toBe("50.0% of total");
  });

  it("does not divide by zero with no curators", () => {
    expect(buildUserStats([])[1].note).toBe("No curators yet");
  });
});

describe("filterUsers", () => {
  const users = [
    toAccountUser(account({ id: "11111111-1111-4111-8111-111111111111" }), null),
    toAccountUser(
      account({
        id: "22222222-2222-4222-8222-222222222222",
        fullName: "Jose Rizal",
        email: "jose@usc.edu.ph",
        inviteAccepted: false,
      }),
      null,
    ),
  ];
  const names = (list: typeof users) => list.map((u) => u.name);

  it("matches name or email, ignoring case and surrounding spaces", () => {
    expect(names(filterUsers(users, { search: "  RIZAL ", status: "" }))).toEqual(["Jose Rizal"]);
    expect(names(filterUsers(users, { search: "maria@", status: "" }))).toEqual(["Maria Santos"]);
  });

  it("combines search with the status filter", () => {
    expect(names(filterUsers(users, { search: "", status: "Pending Invite" }))).toEqual(["Jose Rizal"]);
    expect(filterUsers(users, { search: "maria", status: "Pending Invite" })).toEqual([]);
  });
});
