import type { Card } from "@/types/poker";
import type { PublicPlayer, VisibleRoomState } from "@/types/room";
import type { RoomStage } from "@/types/room";
import { createServiceClient } from "@/lib/supabase/server";

type DbRoom = {
  id: string;
  code: string;
  status: string;
  host_player_id: string | null;
  max_players: number;
};

type DbPlayer = {
  id: string;
  room_id: string;
  nickname: string;
  player_token: string;
  seat_index: number;
  is_host: boolean;
  joined_at: string;
};

type DbGame = {
  id: string;
  room_id: string;
  hand_number: number;
  status: string;
  stage: RoomStage;
  community_cards: Card[];
  showdown_result: unknown;
};

type DbGamePlayer = {
  id: string;
  game_id: string;
  player_id: string;
  hole_cards: Card[];
  hand_rank: string | null;
  hand_score: number[] | null;
  is_winner: boolean;
};

export async function getVisibleRoomState(code: string, playerToken: string): Promise<VisibleRoomState> {
  const supabase = createServiceClient();
  const { data: room, error: roomError } = await supabase
    .from("rooms")
    .select("id, code, status, host_player_id, max_players")
    .eq("code", code.toUpperCase())
    .returns<DbRoom>()
    .single();

  if (roomError || !room) throw new Error("房间不存在");

  const { data: players, error: playersError } = await supabase
    .from("players")
    .select("id, room_id, nickname, player_token, seat_index, is_host, joined_at")
    .eq("room_id", room.id)
    .order("seat_index", { ascending: true })
    .returns<DbPlayer[]>();

  if (playersError) throw new Error(playersError.message);

  const { data: games, error: gameError } = await supabase
    .from("games")
    .select("id, room_id, hand_number, status, stage, community_cards, showdown_result")
    .eq("room_id", room.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .returns<DbGame[]>();

  if (gameError) throw new Error(gameError.message);

  const game = games?.[0] || null;
  let gamePlayers: DbGamePlayer[] = [];
  if (game) {
    const { data, error } = await supabase
      .from("game_players")
      .select("id, game_id, player_id, hole_cards, hand_rank, hand_score, is_winner")
      .eq("game_id", game.id)
      .returns<DbGamePlayer[]>();
    if (error) throw new Error(error.message);
    gamePlayers = data || [];
  }

  const meRaw = players.find((player) => player.player_token === playerToken) || null;
  const isShowdown = game?.stage === "showdown" || game?.stage === "finished";
  const publicPlayers: PublicPlayer[] = players.map((player) => {
    const gamePlayer = gamePlayers.find((item) => item.player_id === player.id);
    const canSeeCards = Boolean(gamePlayer && (isShowdown || player.player_token === playerToken));
    return {
      id: player.id,
      nickname: player.nickname,
      seatIndex: player.seat_index,
      isHost: player.is_host,
      joinedAt: player.joined_at,
      holeCards: canSeeCards ? gamePlayer?.hole_cards || [] : null,
      handRank: isShowdown ? gamePlayer?.hand_rank || null : null,
      isWinner: isShowdown ? Boolean(gamePlayer?.is_winner) : false
    };
  });

  const me = meRaw ? publicPlayers.find((player) => player.id === meRaw.id) || null : null;
  const playing = game && !["showdown", "finished"].includes(game.stage);
  const readyToStart = !game || game.stage === "finished";

  return {
    room: {
      id: room.id,
      code: room.code,
      status: room.status,
      hostPlayerId: room.host_player_id,
      maxPlayers: room.max_players
    },
    me,
    players: publicPlayers,
    game: game
      ? {
          id: game.id,
          handNumber: game.hand_number,
          stage: game.stage,
          communityCards: game.community_cards || [],
          showdownResult: game.showdown_result
        }
      : null,
    canStart: Boolean(meRaw?.is_host && players.length >= 2 && players.length <= room.max_players && !playing && readyToStart),
    canHostAct: Boolean(meRaw?.is_host && game)
  };
}
