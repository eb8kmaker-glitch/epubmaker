import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export const runtime = "nodejs";

/**
 * Verifies the database connection. GET /api/db-test
 * Success: { ok: true, message: "Database connected" }
 * Failure: { ok: false, error: "<Prisma error>" }
 */
export async function GET() {
  try {
    await prisma.user.findMany();
    return NextResponse.json({
      ok: true,
      message: "Database connected",
    });
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { ok: false, error: errorMessage },
      { status: 500 }
    );
  }
}
