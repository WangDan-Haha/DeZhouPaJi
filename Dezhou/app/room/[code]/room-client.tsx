"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { VisibleRoomState } from "@/types/room";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { getOrCreatePlayerToken } from "@/lib/player-token";
import { HostControls } from "@/components/HostControls";
import { MyHand } from "@/components/MyHand";
import { PokerTable } from "@/components/PokerTable";

export function RoomClient({ code }: { code: string }) {
  const [state, setState] = useState<VisibleRoomState | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const playerToken = useMemo(() => getOrCreatePlayerToken(), []);

  const refresh = useCallback(async () => {
    if (!playerToken) return;
    const response = await fetch(`/api/rooms/${code}/state?playerToken=${encodeURIComponent(playerToken)}`, { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error || "读取房间失败");
      return;
    }
    setState(data);
    setError("");
  }, [code, playerToken]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!state?.room.id) return;
    let supabase: ReturnType<typeof createBrowserSupabaseClient> | null = null;
    let channel: ReturnType<ReturnType<typeof createBrowserSupabaseClient>["channel"]> | null = null;
    try {
      supabase = createBrowserSupabaseClient();
      channel = supabase
        .channel(`room-${code}`)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "room_events", filter: `room_id=eq.${state.room.id}` }, () => void refresh())
        .subscribe();
    } catch {
      setError("Realtime 未配置，仍可手动刷新页面查看状态");
    }
    return () => {
      if (channel && supabase) void supabase.removeChannel(channel);
    };
  }, [code, refresh, state?.room.id]);

  async function act(action: string) {
    setBusy(true);
    setError("");
    const response = await fetch(`/api/rooms/${code}/${action}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerToken })
    });
    const data = await response.json();
    setBusy(false);
    if (!response.ok) {
      setError(data.error || "操作失败");
      return;
    }
    setState(data);
  }

  if (!state) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-950 text-white">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-center">
          <div className="text-lg font-black">正在进入房间 {code}</div>
          {error ? <div className="mt-3 text-sm text-red-200">{error}</div> : null}
          <Link href="/" className="mt-5 inline-block text-sm font-bold text-emerald-200">返回首页</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#104d3d,transparent_42%),#070b12] p-3 text-white md:p-5">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 md:h-[calc(100vh-40px)]">
        <header className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-white/10 bg-slate-950/65 px-4 py-3 shadow-2xl backdrop-blur-xl">
          <div>
            <div className="text-xl font-black">德州扒鸡</div>
            <div className="text-xs text-slate-400">房间码 <span className="font-black tracking-[0.25em] text-emerald-200">{state.room.code}</span></div>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
            <span className="rounded-full bg-white/10 px-3 py-1">{state.players.length}/6 人</span>
            <span className="rounded-full bg-white/10 px-3 py-1">{state.me?.isHost ? "我是房主" : "朋友座位"}</span>
            <button onClick={() => void refresh()} className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white">刷新</button>
          </div>
        </header>

        {error ? <div className="rounded-2xl border border-red-300/20 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-100">{error}</div> : null}

        <div className="grid flex-1 gap-3 md:min-h-0 md:grid-cols-[1fr_320px]">
          <PokerTable state={state} />
          <aside className="grid gap-3 md:auto-rows-min">
            <HostControls state={state} busy={busy} onAction={(action) => void act(action)} />
            <MyHand state={state} />
            <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
              <div className="text-sm font-black">本局说明</div>
              <p className="mt-2 text-xs leading-5 text-slate-400">
                页面只负责发牌、公共牌和牌型判断。娱乐筹码请大家手动记录，不提供任何真实价值相关功能。
              </p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
