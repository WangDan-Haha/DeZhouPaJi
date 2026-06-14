import { NextResponse } from "next/server";
import { getVisibleRoomState } from "@/lib/api/visible-state";
import { badRequest } from "@/lib/api/http";

export async function GET(request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const url = new URL(request.url);
  const playerToken = url.searchParams.get("playerToken") || "";
  try {
    const state = await getVisibleRoomState(code, playerToken);
    return NextResponse.json(state);
  } catch (error) {
    return badRequest(error instanceof Error ? error.message : "读取房间失败", 404);
  }
}
