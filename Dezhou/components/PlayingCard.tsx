import type { Card } from "@/types/poker";
import { cardRank, cardSuit, isRed, RANK_LABEL, SUIT_LABEL } from "@/lib/poker/cards";

type PlayingCardProps = {
  card?: Card | null;
  small?: boolean;
  hidden?: boolean;
};

export function PlayingCard({ card, small = false, hidden = false }: PlayingCardProps) {
  if (!card || hidden) {
    return (
      <div className={`${small ? "h-16 w-11" : "h-24 w-16"} relative rounded-lg border border-white/20 bg-blue-950 shadow-lg`}>
        <div className="absolute inset-1 rounded-md border border-white/15 bg-[radial-gradient(circle,rgba(255,255,255,.14)_0_18%,transparent_19%)] bg-[length:14px_14px]" />
        <div className="absolute inset-0 grid place-items-center text-xl font-black text-white/70">◆</div>
      </div>
    );
  }

  const rank = cardRank(card);
  const suit = cardSuit(card);
  const red = isRed(card);

  return (
    <div className={`${small ? "h-16 w-11" : "h-24 w-16"} relative rounded-lg border border-white/90 bg-gradient-to-br from-white to-slate-200 shadow-lg ${red ? "text-red-600" : "text-slate-950"}`}>
      <div className="absolute inset-1 rounded-md border border-slate-300/40" />
      <div className={`${small ? "left-1.5 top-1.5 text-[10px]" : "left-2 top-2 text-xs"} absolute z-10 font-black leading-none`}>
        {RANK_LABEL[rank]}
      </div>
      <div className={`${small ? "text-lg" : "text-3xl"} absolute inset-0 z-10 grid place-items-center font-black`}>
        {SUIT_LABEL[suit]}
      </div>
      <div className={`${small ? "bottom-1.5 right-1.5 text-[10px]" : "bottom-2 right-2 text-xs"} absolute z-10 rotate-180 font-black leading-none`}>
        {RANK_LABEL[rank]}
      </div>
    </div>
  );
}
