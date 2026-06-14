import { NextResponse } from "next/server";
import { showdown } from "@/lib/api/room-actions";
import { badRequest, readJson } from "@/lib/api/http";

export async function POST(request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const body = await readJson<{ playerToken: string }>(request);
  try {
    return NextResponse.json(await showdown(code, body.playerToken || ""));
  } catch (error) {
    return badRequest(error instanceof Error ? error.message : "摊牌失败");
  }
}
