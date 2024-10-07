"use client"

import { Suspense, useState } from "react"

import { CommentaryList, DescriptionList } from "@/types/types"
import AudioDownloader from "@/components/AudioDownloader"
import GenerateDescription from "@/components/GenerateDescription"
import GeneratePost from "@/components/GeneratePost"

export default function GeneratePage() {
  const [description, setDescription] = useState<DescriptionList | null>(null)
  const [commentary, setCommentary] = useState<CommentaryList | null>(null)
  const [audioFiles, setAudioFiles] = useState<string[] | null>(null)

  return (
    <main className="container mx-auto space-y-8 p-4">
      <h1 className="flex items-center justify-center text-3xl font-bold">
        Welcome to your AI Video Maker
      </h1>
      <div className="flex flex-row items-center justify-center gap-4">
        <Suspense fallback={<div>Loading form...</div>}>
          <GenerateDescription setData={setDescription} />
        </Suspense>
        <Suspense fallback={<div>Loading output...</div>}>
          <GeneratePost
            buttonText="Generate Commentary"
            apiRoute="/api/generate/commentary"
            data={description as DescriptionList}
            setData={setCommentary}
          />
        </Suspense>
        <Suspense fallback={<div>Loading output...</div>}>
          <GeneratePost
            buttonText="Generate Audio"
            apiRoute="/api/generate/audio"
            data={commentary as CommentaryList}
            setData={setAudioFiles}
          />
        </Suspense>
        <Suspense fallback={<div>Loading output...</div>}>
          <AudioDownloader audioFiles={audioFiles as string[]} />
        </Suspense>
      </div>
    </main>
  )
}
