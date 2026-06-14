import type { Card, HandResult } from "./poker";

export type RoomStage = "waiting" | "preflop" | "flop" | "turn" | "river" | "showdown" | "finished";

export type PublicPlayer = {
  id: string;
  nickname: string;
  seatIndex: number;
  isHost: boolean;
  joinedAt: string;
  holeCards: Card[] | null;
  handRank: string | null;
  isWinner: boolean;
};

export type VisibleRoomState = {
  room: {
    id: string;
    code: string;
    status: string;
    hostPlayerId: string | null;
    maxPlayers: number;
  };
  me: PublicPlayer | null;
  players: PublicPlayer[];
  game: {
    id: string;
    handNumber: number;
    stage: RoomStage;
    communityCards: Card[];
    showdownResult: unknown;
  } | null;
  canStart: boolean;
  canHostAct: boolean;
};
