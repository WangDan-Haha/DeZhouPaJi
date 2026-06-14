import type { VisibleRoomState } from "@/types/room";
import { PlayingCard } from "./PlayingCard";

export function MyHand({ state }: { state: VisibleRoomState }) {
  const cards = state.me?.holeCards || [];
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm font-black">我的手牌</div>
        <div className="text-xs text-slate-400">{state.me?.nickname || "未入座"}</div>
      </div>
      <div className="flex justify-center gap-3">
        {cards.length ? (
          cards.map((card) => <PlayingCard key={card} card={card} />)
        ) : (
          <>
            <PlayingCard hidden />
            <PlayingCard hidden />
          </>
        )}
      </div>
    </div>
  );
}
