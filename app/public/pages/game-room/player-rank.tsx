import { PlayerRank } from "./state";

export const playerRankDisplayName: Record<PlayerRank, string> = {
  [PlayerRank.president]: "President",
  [PlayerRank.vicePresident]: "Vice-President",
  [PlayerRank.none]: "Citizen",
  [PlayerRank.aHole]: "Scum",
};
export const playerRankSymbol: Record<PlayerRank, string> = {
  [PlayerRank.president]: "🥇",
  [PlayerRank.vicePresident]: "🥈",
  [PlayerRank.none]: "🏷️",
  [PlayerRank.aHole]: "💩",
};
