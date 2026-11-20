import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { isLocalDiskSyncAllowed } from "@/lib/local-guard";

function getCoachDataFilePath(): string {
  const appData =
    process.env.APPDATA ||
    (process.platform === "darwin"
      ? path.join(os.homedir(), "Library", "Application Support")
      : path.join(os.homedir(), ".config"));
  return path.join(appData, "aof-akilli-calisma-kocu", "coach-data.json");
}

export async function GET(req: NextRequest) {
  if (!isLocalDiskSyncAllowed(req)) {
    return NextResponse.json({ raw: null, localSyncDisabled: true });
  }

  try {
    const filePath = getCoachDataFilePath();
    const raw = await fs.readFile(filePath, "utf8");
    return NextResponse.json({ raw });
  } catch (err) {
    const code = (err as NodeJS.ErrnoException | null)?.code;
    if (code === "ENOENT") {
      return NextResponse.json({ raw: null });
    }
    console.error("coach-data.json okunamadı:", err);
    return NextResponse.json(
      { error: "Yerel çalışma verisi okunamadı." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  if (!isLocalDiskSyncAllowed(req)) {
    return NextResponse.json(
      { error: "Bulut/çok kullanıcılı ortamda yerel disk kaydı kapalıdır." },
      { status: 403 }
    );
  }

  try {
    const body = (await req.json()) as { raw?: unknown };
    if (typeof body.raw !== "string" || body.raw.length < 2) {
      return NextResponse.json(
        { error: "Geçersiz veri biçimi." },
        { status: 400 }
      );
    }

    const parsed = JSON.parse(body.raw) as Record<string, unknown>;
    if (!parsed || typeof parsed !== "object" || !("units" in parsed)) {
      return NextResponse.json(
        { error: "Eksik coach-data içeriği." },
        { status: 400 }
      );
    }

    const filePath = getCoachDataFilePath();
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    const tmpPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
    await fs.writeFile(tmpPath, body.raw, "utf8");
    await fs.rename(tmpPath, filePath);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("coach-data.json kaydedilemedi:", err);
    return NextResponse.json(
      { error: "Yerel çalışma verisi kaydedilemedi." },
      { status: 500 }
    );
  }
}
