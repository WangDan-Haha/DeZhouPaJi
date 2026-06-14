import type { VisibleRoomState } from "@/types/room";
import { PlayingCard } from "./PlayingCard";
import { PlayerSeat } from "./PlayerSeat";

const stageLabel: Record<string, string> = {
  waiting: "等待开局",
  preflop: "手牌已发",
  flop: "翻牌",
  turn: "转牌",
  river: "河牌",
  showdown: "摊牌",
  finished: "准备下一局"
};

type PokerTableProps = {
  state: VisibleRoomState;
};

export function PokerTable({ state }: PokerTableProps) {
  const communityCards = state.game?.communityCards || [];
  const emptyCards = Array.from({ length: Math.max(0, 5 - communityCards.length) });

  return (
    <section className="relative min-h-[520px] flex-1 overflow-hidden rounded-3xl border border-white/10 bg-slate-950/40 p-4 shadow-2xl md:min-h-[calc(100vh-96px)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,.24),transparent_58%)]" />
      <div className="absolute inset-x-[7%] bottom-[9%] top-[8%] rounded-[50%] border-[14px] border-[#654427] bg-[radial-gradient(circle_at_center,#0d8b60,#07543c_58%,#043225)] shadow-felt" />
      <div className="absolute inset-x-[13%] bottom-[18%] top-[18%] rounded-[50%] border border-white/15" />

      <div className="absolute left-1/2 top-1/2 z-10 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 px-4 text-center">
        <div className="mb-4 inline-flex items-center gap-3 rounded-xl border border-amber-200/20 bg-slate-950/45 px-4 py-2 backdrop-blur-md">
          <span className="text-sm font-black text-amber-200">{stageLabel[state.game?.stage || "waiting"]}</span>
          <span className="text-sm font-bold text-slate-100">公共牌</span>
        </div>
        <div className="flex justify-center gap-2">
          {communityCards.map((card) => <PlayingCard key={card} card={card} />)}
          {emptyCards.map((_, index) => <PlayingCard key={index} hidden />)}
        </div>
      </div>

      {state.players.map((player) => (
        <PlayerSeat key={player.id} player={player} meId={state.me?.id} />
      ))}
    </section>
  );
}
