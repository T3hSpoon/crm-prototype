/**
 * Hand-written static accounts directory backing the Add Deal wizard's
 * Company -> Prime Group -> Address -> Contact cascade (Quick task
 * 260921-f5a). Deliberately NOT faker-generated and must never call
 * anything from `@faker-js/faker` — `seed-data.ts` calls
 * `faker.seed(20260917)` once at module load and relies on that seed
 * producing a deterministic sequence of faker calls; any faker call here
 * would perturb that shared RNG state and silently change the 150 seeded
 * deals. All companies/prime groups/contacts below are fictional trucking
 * and fleet company stand-ins, consistent with seed-data.ts's "never real
 * prospect/company/person data" rule.
 */

export interface AccountContact {
  id: string;
  name: string;
}

export interface AccountPrimeGroup {
  id: string;
  name: string;
  address: string;
  contacts: AccountContact[];
}

export interface Account {
  id: string;
  company: string;
  primeGroups: AccountPrimeGroup[];
}

export const ACCOUNTS_DIRECTORY: Account[] = [
  {
    id: "acct-mtm",
    company: "MTM",
    primeGroups: [
      {
        id: "acct-mtm-pg-1",
        name: "Manteca Depot",
        address: "1420 Yosemite Ave, Manteca, CA 95336",
        contacts: [
          { id: "acct-mtm-pg-1-c-1", name: "Carla Nguyen" },
          { id: "acct-mtm-pg-1-c-2", name: "Derek Simmons" },
        ],
      },
      {
        id: "acct-mtm-pg-2",
        name: "Sacramento Yard",
        address: "88 Freeport Blvd, Sacramento, CA 95818",
        contacts: [{ id: "acct-mtm-pg-2-c-1", name: "Priya Shah" }],
      },
    ],
  },
  {
    id: "acct-redwood-freightways",
    company: "Redwood Freightways",
    primeGroups: [
      {
        id: "acct-redwood-freightways-pg-1",
        name: "Eureka Terminal",
        address: "500 Waterfront Dr, Eureka, CA 95501",
        contacts: [
          { id: "acct-redwood-freightways-pg-1-c-1", name: "Miguel Torres" },
          { id: "acct-redwood-freightways-pg-1-c-2", name: "Jenna Boyle" },
        ],
      },
      {
        id: "acct-redwood-freightways-pg-2",
        name: "Redding Hub",
        address: "220 Industrial Way, Redding, CA 96002",
        contacts: [{ id: "acct-redwood-freightways-pg-2-c-1", name: "Alan Ford" }],
      },
    ],
  },
  {
    id: "acct-sierra-peak-logistics",
    company: "Sierra Peak Logistics",
    primeGroups: [
      {
        id: "acct-sierra-peak-logistics-pg-1",
        name: "Fresno Yard",
        address: "3300 S Chestnut Ave, Fresno, CA 93725",
        contacts: [{ id: "acct-sierra-peak-logistics-pg-1-c-1", name: "Renee Castillo" }],
      },
      {
        id: "acct-sierra-peak-logistics-pg-2",
        name: "Bakersfield Depot",
        address: "900 Cottonwood Rd, Bakersfield, CA 93307",
        contacts: [
          { id: "acct-sierra-peak-logistics-pg-2-c-1", name: "Tom Whitfield" },
          { id: "acct-sierra-peak-logistics-pg-2-c-2", name: "Lena Park" },
        ],
      },
      {
        id: "acct-sierra-peak-logistics-pg-3",
        name: "Visalia Annex",
        address: "150 Plaza Dr, Visalia, CA 93277",
        contacts: [{ id: "acct-sierra-peak-logistics-pg-3-c-1", name: "Cody Marsh" }],
      },
    ],
  },
  {
    id: "acct-golden-gate-carriers",
    company: "Golden Gate Carriers",
    primeGroups: [
      {
        id: "acct-golden-gate-carriers-pg-1",
        name: "Oakland Terminal",
        address: "2200 Middle Harbor Rd, Oakland, CA 94607",
        contacts: [{ id: "acct-golden-gate-carriers-pg-1-c-1", name: "Ana Reyes" }],
      },
      {
        id: "acct-golden-gate-carriers-pg-2",
        name: "San Jose Yard",
        address: "1750 Berger Dr, San Jose, CA 95112",
        contacts: [
          { id: "acct-golden-gate-carriers-pg-2-c-1", name: "Victor Cho" },
          { id: "acct-golden-gate-carriers-pg-2-c-2", name: "Grace Lindqvist" },
        ],
      },
    ],
  },
  {
    id: "acct-pacific-rim-transport",
    company: "Pacific Rim Transport",
    primeGroups: [
      {
        id: "acct-pacific-rim-transport-pg-1",
        name: "Stockton Depot",
        address: "4100 Navy Dr, Stockton, CA 95206",
        contacts: [{ id: "acct-pacific-rim-transport-pg-1-c-1", name: "Harold Mays" }],
      },
      {
        id: "acct-pacific-rim-transport-pg-2",
        name: "Modesto Yard",
        address: "1600 Yosemite Blvd, Modesto, CA 95354",
        contacts: [{ id: "acct-pacific-rim-transport-pg-2-c-1", name: "Nadia Petrov" }],
      },
    ],
  },
  {
    id: "acct-cascade-route-haulers",
    company: "Cascade Route Haulers",
    primeGroups: [
      {
        id: "acct-cascade-route-haulers-pg-1",
        name: "Chico Terminal",
        address: "780 Fortress St, Chico, CA 95928",
        contacts: [
          { id: "acct-cascade-route-haulers-pg-1-c-1", name: "Owen Blake" },
          { id: "acct-cascade-route-haulers-pg-1-c-2", name: "Sasha Field" },
        ],
      },
      {
        id: "acct-cascade-route-haulers-pg-2",
        name: "Yuba City Depot",
        address: "220 Colusa Ave, Yuba City, CA 95991",
        contacts: [{ id: "acct-cascade-route-haulers-pg-2-c-1", name: "Ray Delgado" }],
      },
    ],
  },
];

export function getCompanyNames(): string[] {
  return ACCOUNTS_DIRECTORY.map((a) => a.company);
}

export function getPrimeGroupsForCompany(company: string): AccountPrimeGroup[] {
  const account = ACCOUNTS_DIRECTORY.find((a) => a.company === company);
  return account ? account.primeGroups : [];
}
