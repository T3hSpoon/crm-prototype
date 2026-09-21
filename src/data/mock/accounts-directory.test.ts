import { describe, it, expect } from "vitest";
import { ACCOUNTS_DIRECTORY, getCompanyNames, getPrimeGroupsForCompany } from "./accounts-directory";

/**
 * Structural-invariant tests for the hand-written ACCOUNTS_DIRECTORY (Quick
 * task 260921-f5a). Mirrors seed-data.test.ts's pure-data assertion style —
 * no DOM/component tests, just hard facts about the actual static dataset.
 */

describe("ACCOUNTS_DIRECTORY", () => {
  it("every account has 2-3 primeGroups", () => {
    for (const account of ACCOUNTS_DIRECTORY) {
      expect(account.primeGroups.length).toBeGreaterThanOrEqual(2);
      expect(account.primeGroups.length).toBeLessThanOrEqual(3);
    }
  });

  it("every primeGroup has a non-empty address and 1-2 contacts", () => {
    for (const account of ACCOUNTS_DIRECTORY) {
      for (const primeGroup of account.primeGroups) {
        expect(primeGroup.address.length).toBeGreaterThan(0);
        expect(primeGroup.contacts.length).toBeGreaterThanOrEqual(1);
        expect(primeGroup.contacts.length).toBeLessThanOrEqual(2);
      }
    }
  });

  it("all 6 company names are unique", () => {
    const companyNames = ACCOUNTS_DIRECTORY.map((a) => a.company);
    expect(companyNames.length).toBe(6);
    expect(new Set(companyNames).size).toBe(companyNames.length);
  });
});

describe("getCompanyNames", () => {
  it("returns exactly ACCOUNTS_DIRECTORY.length names, each matching an account's company", () => {
    const names = getCompanyNames();
    expect(names.length).toBe(ACCOUNTS_DIRECTORY.length);
    for (const name of names) {
      expect(ACCOUNTS_DIRECTORY.some((a) => a.company === name)).toBe(true);
    }
  });
});

describe("getPrimeGroupsForCompany", () => {
  it("returns a non-empty array containing 'Manteca Depot' for 'MTM'", () => {
    const primeGroups = getPrimeGroupsForCompany("MTM");
    expect(primeGroups.length).toBeGreaterThan(0);
    expect(primeGroups.some((pg) => pg.name === "Manteca Depot")).toBe(true);
  });

  it("returns [] for an unknown company", () => {
    expect(getPrimeGroupsForCompany("Nonexistent Company")).toEqual([]);
  });
});
