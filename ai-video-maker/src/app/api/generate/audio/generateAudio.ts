import { timestampToFilename } from "@/utils/helpers"
import { ElevenLabsClient } from "elevenlabs"

import { CommentaryList } from "@/types/types"

const VOICE_ID = "nPczCjzI2devNBz1zQrb"

const client = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY,
})

async function generateAudio(text: string): Promise<Buffer> {
  try {
    const audio = await client.generate({
      voice: VOICE_ID,
      model_id: "eleven_turbo_v2",
      text,
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.8,
        style: 0.0,
        use_speaker_boost: true,
      },
    })

    // Collect the audio data into a buffer
    const chunks: Buffer[] = []
    for await (const chunk of audio) {
      chunks.push(Buffer.from(chunk))
    }
    return Buffer.concat(chunks)
  } catch (error) {
    console.error(`Error generating audio:`, error)
    throw error
  }
}

export async function generateAudioClips(
  commentaryData: CommentaryList
): Promise<Array<{ filename: string; buffer: Buffer }>> {
  const generatedAudio: Array<{ filename: string; buffer: Buffer }> = []

  for (const entry of commentaryData.comments) {
    const filename = timestampToFilename(entry.timestamp)
    const buffer = await generateAudio(entry.commentary)
    generatedAudio.push({ filename, buffer })
  }

  return generatedAudio
}
