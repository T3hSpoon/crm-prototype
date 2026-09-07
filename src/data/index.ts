import type { DealsRepository } from "@/data/deals-repository";
import { MockDealsRepository } from "@/data/mock/mock-deals-repository";

/**
 * The single entry point for all data access. Components and the Zustand
 * store must import `dealsRepository` from here — never from
 * `mock-deals-repository.ts` directly (research/ARCHITECTURE.md repository
 * seam rule). Swapping to a real API implementation later means changing
 * only this file.
 */
export const dealsRepository: DealsRepository = new MockDealsRepository();
