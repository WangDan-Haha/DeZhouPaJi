"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { getOrCreatePlayerToken } from "@/lib/player-token";

export default function HomePage() {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(path: "create" | "join") {
    setError("");
    setBusy(true);
    const playerToken = getOrCreatePlayerToken();
    const response = await fetch(`/api/rooms/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nickname, code: code.toUpperCase(), playerToken })
    });
    const data = await response.json();
    setBusy(false);
    if (!response.ok) {
      setError(data.error || "操作失败");
      return;
    }
    window.localStorage.setItem("dezhou_nickname", nickname);
    router.push(`/room/${data.room.code}`);
  }

  function onCreate(event: FormEvent) {
    event.preventDefault();
    void submit("create");
  }

  function onJoin(event: FormEvent) {
    event.preventDefault();
    void submit("join");
  }

  const canSubmit = nickname.trim().length > 0 && !busy;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#145c46,transparent_44%),#070b12] px-5 py-8 text-white">
      <section className="mx-auto grid min-h-[calc(100vh-64px)] max-w-5xl items-center gap-8 md:grid-cols-[1.1fr_.9fr]">
        <div>
          <div className="mb-5 inline-flex rounded-full border border-emerald-200/20 bg-emerald-300/10 px-4 py-2 text-sm font-bold text-emerald-100">
            朋友局实时牌桌工具
          </div>
          <h1 className="text-4xl font-black tracking-tight md:text-6xl">德州扒鸡</h1>
          <p className="mt-5 max-w-xl text-base leading-8 text-slate-300 md:text-lg">
            创建房间，把 6 位房间码发给朋友。系统负责发手牌、发公共牌和摊牌判定，娱乐筹码由大家手动记录。
          </p>
          <div className="mt-8 grid grid-cols-3 gap-3 text-center">
            {["2-6 人", "隐藏手牌", "实时同步"].map((item) => (
              <div key={item} className="rounded-2xl border border-white/10 bg-white/5 px-3 py-4 text-sm font-black text-slate-100">
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-950/72 p-5 shadow-2xl backdrop-blur-xl">
          <label className="text-sm font-bold text-slate-300">昵称</label>
          <input
            value={nickname}
            maxLength={16}
            onChange={(event) => setNickname(event.target.value)}
            placeholder="输入你的昵称"
            className="mt-2 h-12 w-full rounded-2xl border border-white/10 bg-white/10 px-4 text-base font-bold outline-none focus:border-emerald-300"
          />

          <form onSubmit={onCreate} className="mt-5">
            <button disabled={!canSubmit} className="h-12 w-full rounded-2xl bg-emerald-400 font-black text-emerald-950 transition hover:bg-emerald-300 disabled:bg-slate-700 disabled:text-slate-400">
              创建房间
            </button>
          </form>

          <div className="my-5 h-px bg-white/10" />

          <form onSubmit={onJoin}>
            <label className="text-sm font-bold text-slate-300">房间码</label>
            <input
              value={code}
              maxLength={6}
              onChange={(event) => setCode(event.target.value.toUpperCase())}
              placeholder="6 位房间码"
              className="mt-2 h-12 w-full rounded-2xl border border-white/10 bg-white/10 px-4 text-center text-xl font-black uppercase tracking-[0.35em] outline-none focus:border-blue-300"
            />
            <button disabled={!canSubmit || code.length !== 6} className="mt-3 h-12 w-full rounded-2xl bg-blue-500 font-black text-white transition hover:bg-blue-400 disabled:bg-slate-700 disabled:text-slate-400">
              加入房间
            </button>
          </form>

          {error ? <div className="mt-4 rounded-2xl border border-red-300/20 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-100">{error}</div> : null}
        </div>
      </section>
    </main>
  );
}
