import { Suspense, useState, useEffect, useMemo } from "react";
import { z } from "zod";

import AudioDownloader from "@/components/AudioDownloader";
import GenerateDescription from "@/components/GenerateDescription";
import GeneratePost from "@/components/GeneratePost";
import JsonEditor from "@/components/JsonEditor";
import { CommentaryList, DescriptionList } from "@/lib/types";
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
  const [description, setDescription] = useState<DescriptionList | null>(null);
  const [commentary, setCommentary] = useState<CommentaryList | null>(null);
  const [audioFiles, setAudioFiles] = useState<string[] | null>(null);
  const sampleDescription: DescriptionList = useMemo(() => {
    return {
      descriptions: [
        {
          timestamp: "00:00",
          description: "Sample description 1",
        },
        {
          timestamp: "00:01",
          description: "Sample description 2",
        },
        {
          timestamp: "00:01",
          description: "Sample description 2",
        },
        {
          timestamp: "00:01",
          description: "Sample description 2",
        },
        {
          timestamp: "00:01",
          description: "Sample description 2",
        },
        {
          timestamp: "00:01",
          description: "Sample description 2",
        },
        {
          timestamp: "00:01",
          description: "Sample description 2",
        },
        {
          timestamp: "00:01",
          description: "Sample description 2",
        },
        {
          timestamp: "00:01",
          description: "Sample description 2",
        },
        {
          timestamp: "00:01",
          description: "Sample description 2",
        },
        {
          timestamp: "00:01",
          description: "Sample description 2",
        },
        {
          timestamp: "00:01",
          description: "Sample description 2",
        },
        {
          timestamp: "00:01",
          description: "Sample description 2",
        },
        {
          timestamp: "00:01",
          description: "Sample description 2",
        },
        {
          timestamp: "00:01",
          description: "Sample description 2",
        },
        {
          timestamp: "00:01",
          description: "Sample description 2",
        },
        {
          timestamp: "00:01",
          description: "Sample description 2",
        },
        {
          timestamp: "00:01",
          description: "Sample description 2",
        },
      ],
    };
  }, []);
  useEffect(() => {
    setDescription(sampleDescription);
  }, [sampleDescription]);
  return (
    <main className="container mx-auto space-y-8 p-4">
      <div className="flex flex-row items-center justify-center gap-4">
        <div className="absolute right-0 top-0 m-4">
          <ModeToggle />
        </div>
        <h1 className="flex items-center justify-center text-3xl font-bold">Let&apos;s generate your video!</h1>
        <Icons.testTubeDiagonal className="h-8 w-8" />
      </div>
      <div className="flex flex-row items-stretch justify-center gap-4">
        <Card className="w-1/4 h-[500px]">
          <CardHeader>
            <CardTitle>Generate Description</CardTitle>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<CardSkeleton />}>
              <GenerateDescription setData={setDescription} />
              {description && (
                <JsonEditor
                  title="Edit Description"
                  data={description}
                  onUpdate={(updatedData) => setDescription(updatedData as DescriptionList)}
                />
              )}
            </Suspense>
          </CardContent>
        </Card>

        <Card className="w-1/4 h-[500px]">
          <CardHeader>
            <CardTitle>Generate Commentary</CardTitle>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<CardSkeleton />}>
              <GeneratePost
                title="Generate Commentary"
                apiRoute="/api/py/generate_commentary"
                data={description}
                setData={setCommentary}
                schema={descriptionListSchema}
              />
              {commentary && (
                <JsonEditor
                  title="Edit Commentary"
                  data={commentary}
                  onUpdate={(updatedData) => setCommentary(updatedData as CommentaryList)}
                />
              )}
            </Suspense>
          </CardContent>
        </Card>

        <Card className="w-1/4 h-[500px]">
          <CardHeader>
            <CardTitle>Generate Audio</CardTitle>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<CardSkeleton />}>
              <GeneratePost
                buttonText="Generate Audio"
                apiRoute="/api/py/generate_audio"
                data={commentary as CommentaryList}
                setData={setAudioFiles}
                schema={commentaryListSchema}
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
    </main>
  );
}
