import { NextRequest, NextResponse } from "next/server"

import { generateDescription } from "./generateDescription"

export async function POST(request: NextRequest) {
  const { url } = await request.json()
  console.log("Received URL:", url)

  try {
    const description = await generateDescription(url)

    return NextResponse.json({ description })
  } catch (error) {
    console.error("Error generating description:", error)
    return NextResponse.json(
      { error: "Failed to generate description" },
      { status: 500 }
    )
  }
}
