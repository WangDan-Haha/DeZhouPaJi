import { NextResponse } from "next/server";
import { createRoom } from "@/lib/api/room-actions";
import { badRequest, readJson } from "@/lib/api/http";

export async function POST(request: Request) {
  const body = await readJson<{ nickname: string; playerToken: string }>(request);
  try {
    const state = await createRoom(body.nickname || "", body.playerToken || "");
    return NextResponse.json(state);
  } catch (error) {
    return badRequest(error instanceof Error ? error.message : "创建房间失败");
  }
}
