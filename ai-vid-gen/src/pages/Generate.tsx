import { Suspense, useState, useEffect, useMemo } from "react";
import { z } from "zod";

import AudioDownloader from "@/components/AudioDownloader";
import GenerateDescription from "@/components/GenerateDescription";
import GeneratePost from "@/components/GeneratePost";
import JsonEditor from "@/components/JsonEditor";
import { TimestampDescriptionList } from "@/lib/types";
import { Icons } from "@/components/icons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CardSkeleton } from "@/components/CardSkeletion";
import { ModeToggle } from "@/components/mode-toggle";

// Define Zod schemas for validation
const descriptionListSchema = z.array(
  z.object({
    timestamp: z.string(),
    description: z.string(),
  })
);

const commentaryListSchema = z.array(
  z.object({
    timestamp: z.string(),
    commentary: z.string(),
  })
);

export default function GeneratePage() {
  const [description, setDescription] = useState<TimestampDescriptionList | null>(null);
  const [commentary, setCommentary] = useState<TimestampDescriptionList | null>(null);
  const [audioFiles, setAudioFiles] = useState<string[] | null>(null);
  const sampleDescription: TimestampDescriptionList = useMemo(() => {
    return {
      items: [
        {
          timestamp: "00:00",
          text: "Sample text 1",
        },
        {
          timestamp: "00:01",
          text: "Sample text 2",
        },
        {
          timestamp: "00:01",
          text: "Sample text 2",
        },
        {
          timestamp: "00:01",
          text: "Sample text 2",
        },
        {
          timestamp: "00:01",
          text: "Sample text 2",
        },
        {
          timestamp: "00:01",
          text: "Sample text 2",
        },
        {
          timestamp: "00:01",
          text: "Sample text 2",
        },
        {
          timestamp: "00:01",
          text: "Sample text 2",
        },
        {
          timestamp: "00:01",
          text: "Sample text 2",
        },
        {
          timestamp: "00:01",
          text: "Sample text 2",
        },
        {
          timestamp: "00:01",
          text: "Sample text 2",
        },
        {
          timestamp: "00:01",
          text: "Sample text 2",
        },
        {
          timestamp: "00:01",
          text: "Sample text 2",
        },
        {
          timestamp: "00:01",
          text: "Sample text 2",
        },
        {
          timestamp: "00:01",
          text: "Sample text 2",
        },
        {
          timestamp: "00:01",
          text: "Sample text 2",
        },
        {
          timestamp: "00:01",
          text: "Sample text 2",
        },
        {
          timestamp: "00:01",
          text: "Sample text 2",
        },
      ],
    };
  }, []);
  useEffect(() => {
    setDescription(sampleDescription);
  }, [sampleDescription]);
  return (
    <main className="container mx-auto space-y-8 p-4">
      <div className="flex flex-row items-center justify-center gap-4 pt-2">
        <div className="absolute right-0 top-0 m-4">
          <ModeToggle />
        </div>
        <h1 className="flex items-center justify-center text-3xl font-bold">Let&apos;s generate your video!</h1>
        <Icons.testTubeDiagonal className="h-8 w-8" />
      </div>
      <div className="flex flex-row items-stretch justify-center gap-4">
        <Card className="w-1/4 h-[500px] flex flex-col">
          <CardHeader>
            <CardTitle>Generate Description</CardTitle>
          </CardHeader>
          <CardContent className="flex-grow flex flex-col gap-2">
            <Suspense fallback={<CardSkeleton />}>
              <GenerateDescription setData={setDescription} />
              {description && (
                <JsonEditor
                  title="Edit Description"
                  data={description as TimestampDescriptionList}
                  onUpdate={(updatedData) => setDescription(updatedData as TimestampDescriptionList)}
                />
              )}
            </Suspense>
          </CardContent>
        </Card>

        <Card className="w-1/4 h-[500px] flex flex-col">
          <CardHeader>
            <CardTitle>Generate Commentary</CardTitle>
          </CardHeader>
          <CardContent className="flex-grow flex flex-col">
            <Suspense fallback={<CardSkeleton />}>
              <GeneratePost
                dataType="description"
                apiRoute="/api/py/generate_commentary"
                data={description as TimestampDescriptionList}
                setData={setCommentary}
              />
              {commentary && (
                <JsonEditor
                  title="Edit Commentary"
                  data={commentary}
                  onUpdate={(updatedData) => setCommentary(updatedData as TimestampDescriptionList)}
                />
              )}
            </Suspense>
          </CardContent>
        </Card>

        <Card className="w-1/4 h-[500px] flex flex-col">
          <CardHeader>
            <CardTitle>Generate Audio</CardTitle>
          </CardHeader>
          <CardContent className="flex-grow flex flex-col">
            <Suspense fallback={<CardSkeleton />}>
              <GeneratePost
                dataType="commentary"
                apiRoute="/api/py/generate_audio"
                data={commentary as TimestampDescriptionList}
                setData={setAudioFiles}
              />
            </Suspense>
          </CardContent>
        </Card>

        <Card className="w-1/4 h-[500px]">
          <CardHeader>
            <CardTitle>Download Audio</CardTitle>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<CardSkeleton />}>
              <AudioDownloader audioFiles={audioFiles as string[]} />
            </Suspense>
          </CardContent>
        </Card>
      </div>
      <div>
        <p className="text-sm text-gray-500">
          This app uses Gemini 1.5 Pro to generate a description of the provided video. The description is then used to create a commentary
          at all the pivotal moments in the video with GPT 4o mini. This commentary is sent to Elevenlabs and made into audio files
        </p>
      </div>
    </main>
  );
}
