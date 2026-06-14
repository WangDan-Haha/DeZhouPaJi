import type { Card } from "@/types/poker";
import { createDeck, shuffle } from "@/lib/poker/cards";
import { evaluateSeven, findWinners } from "@/lib/poker/evaluate";
import { createRoomCode } from "@/lib/room-code";
import { createServiceClient } from "@/lib/supabase/server";
import { getVisibleRoomState } from "./visible-state";

type PlayerRow = {
  id: string;
  room_id: string;
  nickname: string;
  player_token: string;
  seat_index: number;
  is_host: boolean;
};

type RoomRow = {
  id: string;
  code: string;
  status: string;
  host_player_id: string | null;
  max_players: number;
};

type GameRow = {
  id: string;
  room_id: string;
  hand_number: number;
  status: string;
  stage: string;
  deck: Card[];
  community_cards: Card[];
};

type GamePlayerRow = {
  id: string;
  game_id: string;
  player_id: string;
  hole_cards: Card[];
};

function cleanNickname(nickname: string) {
  return nickname.trim().slice(0, 16);
}

function requireToken(playerToken: string) {
  if (!playerToken || playerToken.length < 12) throw new Error("玩家身份无效，请刷新后重试");
}

async function getRoomByCode(code: string) {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("rooms")
    .select("id, code, status, host_player_id, max_players")
    .eq("code", code.toUpperCase())
    .returns<RoomRow>()
    .single();
  if (error || !data) throw new Error("房间不存在");
  return data;
}

async function getPlayers(roomId: string) {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("players")
    .select("id, room_id, nickname, player_token, seat_index, is_host")
    .eq("room_id", roomId)
    .order("seat_index", { ascending: true })
    .returns<PlayerRow[]>();
  if (error) throw new Error(error.message);
  return data || [];
}

async function requireHost(room: RoomRow, playerToken: string) {
  const players = await getPlayers(room.id);
  const player = players.find((item) => item.player_token === playerToken);
  if (!player || !player.is_host || player.id !== room.host_player_id) {
    throw new Error("只有房主可以操作");
  }
  return { player, players };
}

async function getCurrentGame(roomId: string) {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("games")
    .select("id, room_id, hand_number, status, stage, deck, community_cards")
    .eq("room_id", roomId)
    .order("created_at", { ascending: false })
    .limit(1)
    .returns<GameRow[]>();
  if (error) throw new Error(error.message);
  return data?.[0] || null;
}

async function emitRoomEvent(roomId: string, eventType: string) {
  const supabase = createServiceClient();
  await supabase.from("room_events").insert({ room_id: roomId, event_type: eventType });
}

export async function createRoom(nickname: string, playerToken: string) {
  requireToken(playerToken);
  const clean = cleanNickname(nickname);
  if (!clean) throw new Error("请输入昵称");
  const supabase = createServiceClient();

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const code = createRoomCode();
    const { data: room, error: roomError } = await supabase
      .from("rooms")
      .insert({ code, status: "waiting", max_players: 6 })
      .select("id, code, status, host_player_id, max_players")
      .returns<RoomRow>()
      .single();

    if (roomError) {
      if (roomError.code === "23505") continue;
      throw new Error(roomError.message);
    }

    const { data: player, error: playerError } = await supabase
      .from("players")
      .insert({
        room_id: room.id,
        nickname: clean,
        player_token: playerToken,
        seat_index: 0,
        is_host: true
      })
      .select("id")
      .returns<{ id: string }>()
      .single();

    if (playerError || !player) throw new Error(playerError?.message || "创建玩家失败");

    const { error: updateError } = await supabase
      .from("rooms")
      .update({ host_player_id: player.id, updated_at: new Date().toISOString() })
      .eq("id", room.id);
    if (updateError) throw new Error(updateError.message);
    await emitRoomEvent(room.id, "room_created");

    return getVisibleRoomState(code, playerToken);
  }

  throw new Error("房间码生成失败，请重试");
}

export async function joinRoom(code: string, nickname: string, playerToken: string) {
  requireToken(playerToken);
  const clean = cleanNickname(nickname);
  if (!clean) throw new Error("请输入昵称");
  const room = await getRoomByCode(code);
  const supabase = createServiceClient();
  const players = await getPlayers(room.id);
  const existing = players.find((player) => player.player_token === playerToken);
  if (existing) {
    await supabase.from("players").update({ nickname: clean, last_seen_at: new Date().toISOString() }).eq("id", existing.id);
    return getVisibleRoomState(room.code, playerToken);
  }

  if (players.length >= room.max_players) throw new Error("房间人数已满");
  if (room.status !== "waiting") throw new Error("本局已经开始，请等下一局");

  const takenSeats = new Set(players.map((player) => player.seat_index));
  const seatIndex = Array.from({ length: room.max_players }, (_, index) => index).find((index) => !takenSeats.has(index));
  if (seatIndex === undefined) throw new Error("没有可用座位");

  const { error } = await supabase.from("players").insert({
    room_id: room.id,
    nickname: clean,
    player_token: playerToken,
    seat_index: seatIndex,
    is_host: false
  });
  if (error) throw new Error(error.message);
  await emitRoomEvent(room.id, "player_joined");

  return getVisibleRoomState(room.code, playerToken);
}

export async function startGame(code: string, playerToken: string) {
  requireToken(playerToken);
  const room = await getRoomByCode(code);
  const { players } = await requireHost(room, playerToken);
  if (players.length < 2) throw new Error("至少需要 2 位玩家");
  if (players.length > room.max_players) throw new Error("房间人数超过上限");

  const currentGame = await getCurrentGame(room.id);
  if (currentGame && !["showdown", "finished"].includes(currentGame.stage)) {
    throw new Error("当前牌局还没有结束");
  }

  const supabase = createServiceClient();
  const deck = shuffle(createDeck());
  const gamePlayers = players.map((player) => ({
    player,
    cards: [deck.pop(), deck.pop()] as Card[]
  }));
  const nextHandNumber = currentGame ? currentGame.hand_number + 1 : 1;

  const { data: game, error: gameError } = await supabase
    .from("games")
    .insert({
      room_id: room.id,
      hand_number: nextHandNumber,
      status: "playing",
      stage: "preflop",
      deck,
      community_cards: []
    })
    .select("id")
    .returns<{ id: string }>()
    .single();

  if (gameError || !game) throw new Error(gameError?.message || "开局失败");

  const { error: playerError } = await supabase.from("game_players").insert(
    gamePlayers.map((item) => ({
      game_id: game.id,
      player_id: item.player.id,
      hole_cards: item.cards
    }))
  );
  if (playerError) throw new Error(playerError.message);

  const { error: roomError } = await supabase
    .from("rooms")
    .update({ status: "playing", updated_at: new Date().toISOString() })
    .eq("id", room.id);
  if (roomError) throw new Error(roomError.message);
  await emitRoomEvent(room.id, "game_started");

  return getVisibleRoomState(room.code, playerToken);
}

export async function dealCommunity(code: string, playerToken: string, targetStage: "flop" | "turn" | "river") {
  requireToken(playerToken);
  const room = await getRoomByCode(code);
  await requireHost(room, playerToken);
  const game = await getCurrentGame(room.id);
  if (!game) throw new Error("还没有开始游戏");

  const rules = {
    flop: { from: "preflop", count: 3 },
    turn: { from: "flop", count: 1 },
    river: { from: "turn", count: 1 }
  };
  const rule = rules[targetStage];
  if (game.stage !== rule.from) throw new Error("当前阶段不能执行这个操作");

  const deck = game.deck.slice();
  const nextCards = Array.from({ length: rule.count }, () => deck.pop()).filter(Boolean) as Card[];
  const communityCards = [...(game.community_cards || []), ...nextCards];
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("games")
    .update({
      stage: targetStage,
      deck,
      community_cards: communityCards,
      updated_at: new Date().toISOString()
    })
    .eq("id", game.id);
  if (error) throw new Error(error.message);
  await emitRoomEvent(room.id, targetStage);

  return getVisibleRoomState(room.code, playerToken);
}

export async function showdown(code: string, playerToken: string) {
  requireToken(playerToken);
  const room = await getRoomByCode(code);
  await requireHost(room, playerToken);
  const game = await getCurrentGame(room.id);
  if (!game) throw new Error("还没有开始游戏");
  if (game.stage !== "river") throw new Error("请先发完公共牌");
  if ((game.community_cards || []).length !== 5) throw new Error("公共牌数量不完整");

  const supabase = createServiceClient();
  const { data: gamePlayers, error: gamePlayersError } = await supabase
    .from("game_players")
    .select("id, game_id, player_id, hole_cards")
    .eq("game_id", game.id)
    .returns<GamePlayerRow[]>();
  if (gamePlayersError) throw new Error(gamePlayersError.message);

  const players = await getPlayers(room.id);
  const winners = findWinners(
    (gamePlayers || []).map((item) => ({ id: item.player_id, holeCards: item.hole_cards })),
    game.community_cards
  );
  const winnerIds = winners.map((winner) => winner.id);

  await Promise.all(
    (gamePlayers || []).map((item) => {
      const result = evaluateSeven([...item.hole_cards, ...game.community_cards]);
      return supabase
        .from("game_players")
        .update({
          hand_rank: result.name,
          hand_score: result.score,
          is_winner: winnerIds.includes(item.player_id)
        })
        .eq("id", item.id);
    })
  );

  const result = winners.map((winner) => ({
    playerId: winner.id,
    nickname: players.find((player) => player.id === winner.id)?.nickname || "玩家",
    handRank: winner.result.name,
    bestCards: winner.result.bestCards
  }));

  const { error: gameError } = await supabase
    .from("games")
    .update({
      status: "showdown",
      stage: "showdown",
      winner_player_ids: winnerIds,
      showdown_result: result,
      updated_at: new Date().toISOString()
    })
    .eq("id", game.id);
  if (gameError) throw new Error(gameError.message);

  await supabase.from("rooms").update({ status: "showdown", updated_at: new Date().toISOString() }).eq("id", room.id);
  await emitRoomEvent(room.id, "showdown");
  return getVisibleRoomState(room.code, playerToken);
}

export async function nextHand(code: string, playerToken: string) {
  requireToken(playerToken);
  const room = await getRoomByCode(code);
  await requireHost(room, playerToken);
  const game = await getCurrentGame(room.id);
  const supabase = createServiceClient();
  if (game) {
    await supabase
      .from("games")
      .update({ status: "finished", stage: "finished", updated_at: new Date().toISOString() })
      .eq("id", game.id);
  }
  const { error } = await supabase.from("rooms").update({ status: "waiting", updated_at: new Date().toISOString() }).eq("id", room.id);
  if (error) throw new Error(error.message);
  await emitRoomEvent(room.id, "next_hand");
  return getVisibleRoomState(room.code, playerToken);
}
