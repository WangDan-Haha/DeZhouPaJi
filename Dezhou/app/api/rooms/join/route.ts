import { NextResponse } from "next/server";
import { joinRoom } from "@/lib/api/room-actions";
import { badRequest, readJson } from "@/lib/api/http";

export async function POST(request: Request) {
  const body = await readJson<{ code: string; nickname: string; playerToken: string }>(request);
  try {
    const state = await joinRoom(body.code || "", body.nickname || "", body.playerToken || "");
    return NextResponse.json(state);
  } catch (error) {
    return badRequest(error instanceof Error ? error.message : "加入房间失败");
  }
}
