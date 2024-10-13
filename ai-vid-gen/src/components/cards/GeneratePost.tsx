"use client";

import React, { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { TimestampTextList, GenerateOptions } from "@/lib/types";
import { Icons } from "@/components/icons";
import QuickInfo from "@/components/QuickInfo";
import { Separator } from "@/components/ui/separator";
import StepOptions from "@/components/cards/StepOptions";
import { generateCommentary, generateAudio } from "@/api/apiHelper";

interface GeneratePostProps {
  dataType: "commentary" | "audio";
  data: TimestampTextList | null;
  setData: React.Dispatch<React.SetStateAction<TimestampTextList | null>>;
  options?: GenerateOptions;
}

function GeneratePost({ dataType, data, setData, options }: GeneratePostProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [optionValues, setOptionValues] = useState<Record<string, boolean | number>>({});
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);

  // Initialize option values
  useEffect(() => {
    if (options) {
      const initialValues = Object.entries(options).reduce((acc, [key, option]) => {
        acc[key] = option.default;
        return acc;
      }, {} as Record<string, boolean | number>);
      setOptionValues(initialValues);
    }
  }, [options]);

  const handleOptionChange = (key: string, value: boolean | number) => {
    setOptionValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleGenerate = async () => {
    if (!data) {
      toast({
        title: "Error",
        description: "No data available to generate post.",
        variant: "destructive",
      });
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      if (dataType === "commentary") {
        const commentaryData = await generateCommentary(data as TimestampTextList, optionValues);
        setData(commentaryData);
      } else if (dataType === "audio") {
        const audioFiles = await generateAudio(data as TimestampTextList, optionValues);
        setData(audioFiles);
      }
      toast({
        title: "Success",
        description: `${dataType} generated successfully.`,
      });
    } catch (err) {
      console.error(`Error generating ${dataType}:`, err);
      setError(`Failed to generate ${dataType}. Please try again.`);
      toast({
        title: "Error",
        description: `Failed to generate ${dataType}. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-grow">
        <QuickInfo data={data} />
      </div>
      <div className="text-sm font-medium text-muted-foreground">Options</div>
      <Separator className="mb-4 mt-3" />
      {options && <StepOptions options={options} optionValues={optionValues} onOptionChange={handleOptionChange} />}
      <div className="flex justify-center pt-4">
        <Button onClick={handleGenerate} disabled={isLoading || !data} className="font-bold">
          {isLoading ? (
            <>
              <Icons.loader className="h-[1.2rem] w-[1.2rem] animate-spin mr-2" />
              Generating...
            </>
          ) : (
            `Generate ${dataType}`
          )}
        </Button>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}

export default GeneratePost;
