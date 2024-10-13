import { Suspense, useState, useEffect, useMemo } from "react";

import AudioDownloader from "@/components/cards/AudioDownloader";
import GenerateDescription from "@/components/cards/GenerateDescription";
import GeneratePost from "@/components/cards/GeneratePost";
import StepTransition from "@/components/cards/StepTransition";
import StepCard from "@/components/cards/StepCard";
import { TimestampTextList, GenerateOptions } from "@/lib/types";
import { Icons } from "@/components/icons";
import { CardSkeleton } from "@/components/skeletons/CardSkeletion";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
export default function GeneratePage() {
  const [description, setDescription] = useState<TimestampTextList | null>(null);
  const [commentary, setCommentary] = useState<TimestampTextList | null>(null);
  const [audioFiles, setAudioFiles] = useState<Array<{ timestamp: string; filename: string }> | null>(null);

  // const sampleDescription: TimestampTextList = useMemo(() => {
  //   return {
  //     items: [
  //       {
  //         timestamp: "00:00",
  //         text: "Sample text 1",
  //       },
  //     ],
  //   };
  // }, []);
  // useEffect(() => {
  //   setDescription(sampleDescription);
  // }, [sampleDescription]);

  const commentaryOptions: GenerateOptions = {
    intro: {
      type: "checkbox",
      label: "Include Intro",
      key: "intro",
      default: true,
    },
    outro: {
      type: "checkbox",
      label: "Include Outro",
      key: "outro",
      default: true,
    },
    temperature: {
      type: "slider",
      label: "Temperature",
      key: "temperature",
      default: 0.7,
      min: 0,
      max: 2,
      step: 0.01,
    },
  };

  const audioOptions: GenerateOptions = {
    speed: {
      type: "slider",
      label: "Speech Speed",
      key: "speed",
      default: 1,
      min: 0.5,
      max: 2,
      step: 0.1,
    },
  };

  return (
    <main className="container mx-auto space-y-8 p-4">
      <div className="flex flex-row items-center justify-center gap-4 pt-2">
        <div className="absolute left-0 top-0 m-4">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <Icons.chevronLeft className="w-[1.5rem] h-[1.5rem] -translate-x-[0.075rem]" />
            </Button>
          </Link>
        </div>
        <div className="absolute right-0 top-0 m-4">
          <ModeToggle />
        </div>
        <h1 className="flex items-center justify-center text-3xl">Content Killer</h1>
        <Icons.skull className="h-12 w-12" />
      </div>

      <div className="flex flex-row items-stretch justify-center gap-4">
        <StepCard
          title="Description"
          content={
            <Suspense fallback={<CardSkeleton />}>
              <GenerateDescription setData={setDescription} />
            </Suspense>
          }
          info="This step generates a comprehensive description of the video, with timestamps for all the pivotal moments in the video."
        />

        <StepTransition
          data={description as TimestampTextList}
          jsonEditorTitle="Edit Description Data"
          onUpdate={(updatedData) => setDescription(updatedData as TimestampTextList)}
        />

        <StepCard
          title="Commentary"
          content={
            <Suspense fallback={<CardSkeleton />}>
              <GeneratePost
                dataType="commentary"
                data={description as TimestampTextList}
                setData={setCommentary}
                options={commentaryOptions}
              />
            </Suspense>
          }
          info="This step generates a commentary for the video at all the pivotal moments in the video."
        />

        <StepTransition
          data={commentary as TimestampTextList}
          jsonEditorTitle="Edit Commentary Data"
          onUpdate={(updatedData) => setCommentary(updatedData as TimestampTextList)}
        />

        <StepCard
          title="Audio"
          content={
            <Suspense fallback={<CardSkeleton />}>
              <GeneratePost dataType="audio" data={commentary as TimestampTextList} setData={setAudioFiles} options={audioOptions} />
            </Suspense>
          }
          info="This step generates audio files for the commentary at all pivotal moments in the video."
        />

        <StepTransition data={audioFiles} onUpdate={(updatedData) => setAudioFiles(updatedData)} />

        <StepCard
          title="Files"
          content={
            <Suspense fallback={<CardSkeleton />}>
              <AudioDownloader audioFiles={audioFiles} />
            </Suspense>
          }
          info="This step downloads the audio files generated in the previous step."
        />
      </div>

      <div>
        <p className="text-sm text-gray-500">
          This app uses Gemini 1.5 Pro to generate a description of the provided video. The description is then used to create a commentary
          at all pivotal moments in the video with GPT 4o mini. This commentary is sent to Elevenlabs and made into audio files
        </p>
      </div>
    </main>
  );
}
