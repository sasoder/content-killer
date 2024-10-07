import { NextRequest, NextResponse } from "next/server"

import { generateCommentary } from "./generateCommentary"

export async function POST(request: NextRequest) {
  const commentaryData = await request.json()

  try {
    const commentary = await generateCommentary(commentaryData)

    return NextResponse.json({ commentary })
  } catch (error) {
    console.error("Error generating commentary:", error)
    return NextResponse.json(
      { error: "Failed to generate commentary" },
      { status: 500 }
    )
  }
}
