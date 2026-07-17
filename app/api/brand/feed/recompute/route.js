import { NextResponse } from "next/server";

export async function POST(request) {
  return NextResponse.json({
    success: true,
    message: "Inline recomputation is disabled; feeds are calculated dynamically at request time."
  }, { status: 200 });
}
