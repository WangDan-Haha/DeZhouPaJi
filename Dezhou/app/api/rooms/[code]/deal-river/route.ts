import { NextResponse } from "next/server";
import { dealCommunity } from "@/lib/api/room-actions";
import { badRequest, readJson } from "@/lib/api/http";

export async function POST(request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const body = await readJson<{ playerToken: string }>(request);
  try {
    return NextResponse.json(await dealCommunity(code, body.playerToken || "", "river"));
  } catch (error) {
    return badRequest(error instanceof Error ? error.message : "发河牌失败");
  }
}
