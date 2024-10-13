import { Suspense, useState, useEffect, useCallback } from "react";
import { fetchExistingData } from "@/api/apiHelper";
import AudioDownloader from "@/components/cards/AudioDownloader";
import GenerateDescription from "@/components/cards/GenerateDescription";
import GeneratePost from "@/components/cards/GeneratePost";
import StepTransition from "@/components/cards/StepTransition";
import StepCard from "@/components/cards/StepCard";
import { TimestampTextList, AudioResponse } from "@/lib/schema";
import { Icons } from "@/components/icons";
import { CardSkeleton } from "@/components/skeletons/CardSkeletion";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { GenerateOptions } from "../lib/types";

export default function GeneratePage() {
  const [description, setDescription] = useState<TimestampTextList | null>(null);
  const [commentary, setCommentary] = useState<TimestampTextList | null>(null);
  const [audioFiles, setAudioFiles] = useState<AudioResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [descriptionData, commentaryData, audioData] = await Promise.all([
        fetchExistingData("description"),
        fetchExistingData("commentary"),
        fetchExistingData("audio"),
      ]);
      setDescription(descriptionData);
      setCommentary(commentaryData);
      setAudioFiles(audioData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const updateDescription = useCallback((newData: TimestampTextList) => {
    setDescription(newData);
  }, []);

  const updateCommentary = useCallback((newData: TimestampTextList) => {
    setCommentary(newData);
  }, []);

  const updateAudio = useCallback((newData: AudioResponse) => {
    setAudioFiles(newData);
  }, []);

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
    stability: {
      type: "slider",
      label: "Emotion",
      key: "stability",
      default: 70,
      min: 0,
      max: 100,
      step: 1,
    },
  };

  if (isLoading) {
    return <div>Loading...</div>; // Or a more sophisticated loading component
  }

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
        <Icons.skull className="h-12 w-12 -translate-y-1" />
      </div>

      <div className="flex flex-row items-stretch justify-center gap-4">
        <StepCard
          title="Description"
          content={
            <Suspense fallback={<CardSkeleton />}>
              <GenerateDescription mutate={updateDescription} />
            </Suspense>
          }
          info="This step generates a comprehensive description of the video, with timestamps for all the pivotal moments in the video."
        />

        <StepTransition data={description} jsonEditorTitle="Edit Description Data" onUpdate={updateDescription} />

        <StepCard
          title="Commentary"
          content={
            <Suspense fallback={<CardSkeleton />}>
              <GeneratePost dataType="commentary" data={description} mutate={updateCommentary} options={commentaryOptions} />
            </Suspense>
          }
          info="This step generates a commentary for the video at all the pivotal moments in the video."
        />

        <StepTransition data={commentary} jsonEditorTitle="Edit Commentary Data" onUpdate={updateCommentary} />

        <StepCard
          title="Audio"
          content={
            <Suspense fallback={<CardSkeleton />}>
              <GeneratePost dataType="audio" data={commentary} mutate={updateAudio} options={audioOptions} />
            </Suspense>
          }
          info="This step generates audio files for the commentary at all pivotal moments in the video."
        />

        <StepTransition data={null} jsonEditorTitle={null} onUpdate={null} />

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
