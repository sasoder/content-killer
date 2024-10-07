import { NextResponse } from "next/server"

import {
  Commentary,
  CommentaryList,
  Description,
  DescriptionList,
} from "@/types/types"

export async function POST(req: Request) {
  try {
    const { url } = await req.json()

    if (!url) {
      return NextResponse.json(
        { message: "URL is required" },
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      )
    }

    const description: DescriptionList = await generateDescription(url)
    const commentary: CommentaryList = await generateCommentary(description)
    const audioFiles: string[] = await generateAudioClips(commentary)

    return NextResponse.json(
      {
        description,
        commentary,
        audioFiles,
      },
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    )
  } catch (error) {
    console.error("Error in API route:", error)
    return NextResponse.json(
      { message: "Internal Server Error" },
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    )
  }
}

export async function generateDescription(
  url: string
): Promise<DescriptionList> {
  const response = await fetch("/api/generators/generateDescription", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ url }),
  })
  const data = await response.json()
  return data as DescriptionList
}

export async function generateCommentary(
  description: DescriptionList
): Promise<CommentaryList> {
  const response = await fetch("/api/generators/generateCommentary", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ description }),
  })
  const data = await response.json()
  return data as CommentaryList
}

export async function generateAudioClips(
  commentary: CommentaryList
): Promise<string[]> {
  try {
    const response = await fetch("/api/generators/generateAudioClips", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ commentary }),
    })
    const data = await response.json()
    return data as string[]
  } catch (error) {
    console.error("Error generating audio clips:", error)
    throw new Error("Failed to generate audio clips")
  }
}
