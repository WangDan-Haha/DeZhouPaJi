import type { PublicPlayer } from "@/types/room";
import { PlayingCard } from "./PlayingCard";

type PlayerSeatProps = {
  player: PublicPlayer;
  meId?: string;
};

const seatPositions = [
  "left-1/2 bottom-0 -translate-x-1/2 translate-y-1/4",
  "left-4 bottom-1/4",
  "left-8 top-8",
  "left-1/2 top-0 -translate-x-1/2 -translate-y-1/4",
  "right-8 top-8",
  "right-4 bottom-1/4"
];

const colors = ["bg-emerald-500", "bg-blue-500", "bg-orange-500", "bg-fuchsia-500", "bg-rose-500", "bg-cyan-500"];

export function PlayerSeat({ player, meId }: PlayerSeatProps) {
  const isMe = player.id === meId;
  const position = seatPositions[player.seatIndex] || seatPositions[0];
  const color = colors[player.seatIndex % colors.length];

  return (
    <div className={`absolute ${position} z-20`}>
      <div className={`flex min-w-40 items-center gap-2 rounded-xl border px-2.5 py-2 shadow-2xl backdrop-blur-md ${player.isWinner ? "border-emerald-300 bg-emerald-950/80" : isMe ? "border-amber-300 bg-slate-900/85" : "border-white/10 bg-slate-950/75"}`}>
        <div className="text-center">
          <div className={`grid h-11 w-11 place-items-center rounded-full border-2 border-white/70 ${color} text-lg font-black`}>
            {player.nickname.slice(0, 1)}
          </div>
          <div className={`mt-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${player.isHost ? "bg-amber-300 text-amber-950" : "bg-slate-700 text-slate-200"}`}>
            {player.isHost ? "房主" : isMe ? "我" : "玩家"}
          </div>
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="max-w-20 truncate text-sm font-black">{player.nickname}</div>
            {player.handRank ? <div className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-amber-100">{player.handRank}</div> : null}
          </div>
          <div className="mt-1 flex gap-1">
            {player.holeCards ? (
              player.holeCards.map((card) => <PlayingCard key={card} card={card} small />)
            ) : (
              <>
                <PlayingCard small hidden />
                <PlayingCard small hidden />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
