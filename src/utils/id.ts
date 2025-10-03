import type { PartyId } from "@/types/ids"

export const makePartyId = (): PartyId =>
  `p_${crypto.randomUUID()}` as PartyId;

export const isPartyId = (s: string): s is PartyId => s.startsWith("p_");
