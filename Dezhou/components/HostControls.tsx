"use client";

import type { VisibleRoomState } from "@/types/room";

type HostControlsProps = {
  state: VisibleRoomState;
  busy: boolean;
  onAction: (action: string) => void;
};

export function HostControls({ state, busy, onAction }: HostControlsProps) {
  const stage = state.game?.stage || "waiting";
  const isHost = Boolean(state.me?.isHost);

  const actions = [
    { action: "start", label: "开始一局", show: !state.game || stage === "finished", disabled: !state.canStart },
    { action: "deal-flop", label: "发翻牌", show: stage === "preflop", disabled: false },
    { action: "deal-turn", label: "发转牌", show: stage === "flop", disabled: false },
    { action: "deal-river", label: "发河牌", show: stage === "turn", disabled: false },
    { action: "showdown", label: "摊牌", show: stage === "river", disabled: false },
    { action: "next-hand", label: "下一局", show: stage === "showdown", disabled: false }
  ];

  if (!isHost) {
    return (
      <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
        <div className="text-sm font-black">等待房主操作</div>
        <p className="mt-2 text-xs leading-5 text-slate-400">房主会控制发公共牌和摊牌。娱乐筹码可在线下或聊天里手动记录。</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm font-black">房主控制</div>
        <div className="text-xs text-slate-400">{state.players.length}/6 人</div>
      </div>
      <div className="grid gap-2">
        {actions.filter((item) => item.show).map((item) => (
          <button
            key={item.action}
            disabled={busy || item.disabled}
            onClick={() => onAction(item.action)}
            className="rounded-xl bg-emerald-400 px-4 py-3 text-sm font-black text-emerald-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
