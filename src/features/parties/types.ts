import type { PartyId } from "@/types/ids";


export interface Party {
  id: PartyId;
  name: string;
  nameNorm: string;
  aliases?: string[];
  createdAt: number;
  updatedAt: number;
  freq: number;
}
