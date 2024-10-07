import { NextRequest, NextResponse } from "next/server"

import { generateAudioClips } from "./generateAudio"

export async function POST(request: NextRequest) {
  const commentaryData = await request.json()

  try {
    const audioClips = await generateAudioClips(commentaryData)

    const serializedAudioClips = audioClips.map((clip) => ({
      filename: clip.filename,
      data: clip.buffer.toString("base64"),
    }))

    return NextResponse.json({ audioClips: serializedAudioClips })
  } catch (error) {
    console.error("Error generating audio clips:", error)
    return NextResponse.json(
      { error: "Failed to generate audio clips" },
      { status: 500 }
    )
  }
}
