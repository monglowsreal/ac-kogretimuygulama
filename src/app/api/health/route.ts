import { NextRequest, NextResponse } from "next/server";
import { getAiStatusSnapshot } from "@/lib/ai";
import { ClientAiOverride } from "@/types/coach";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    ...getAiStatusSnapshot(),
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { clientAiConfig?: ClientAiOverride };
    return NextResponse.json({
      ok: true,
      ...getAiStatusSnapshot(body?.clientAiConfig),
    });
  } catch {
    return NextResponse.json({
      ok: true,
      ...getAiStatusSnapshot(),
    });
  }
}
