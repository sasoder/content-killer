import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { TimestampTextList, CommentaryOptions, AudioOptions, AudioResponse, TimestampText } from "@/lib/schema";
import { GenerateOptions } from "@/lib/types";
import { Icons } from "@/components/icons";
import QuickInfo from "@/components/QuickInfo";
import { Separator } from "@/components/ui/separator";
import StepOptions from "@/components/cards/StepOptions";
import { generateCommentary, generateAudio } from "@/api/apiHelper";

interface GeneratePostProps {
  dataType: "commentary" | "audio";
  data: TimestampTextList | AudioResponse | null;
  mutate: (newData: TimestampTextList | AudioResponse) => void;
  options?: GenerateOptions;
}

function GeneratePost({ dataType, data, mutate, options }: GeneratePostProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [optionValues, setOptionValues] = useState<Record<string, boolean | number>>({});
  const { toast } = useToast();

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
    if (!data || data.items.length === 0) {
      toast({
        title: "Error",
        description: "No data available to generate post.",
        variant: "destructive",
      });
      return;
    }
    setIsLoading(true);
    try {
      let newData;
      if (dataType === "commentary") {
        newData = await generateCommentary(data.items as TimestampText[], optionValues as CommentaryOptions);
      } else if (dataType === "audio") {
        const audioOptions = { ...(optionValues as AudioOptions) };
        if ("stability" in audioOptions) {
          // Translating between emotion and stability
          audioOptions.stability = 100 - audioOptions.stability;
        }
        newData = await generateAudio(data.items as TimestampText[], audioOptions as AudioOptions);
      }
      mutate(newData as TimestampTextList | AudioResponse);
      toast({
        title: "Success",
        description: `${dataType} generated successfully.`,
      });
    } catch (err) {
      console.error(`Error generating ${dataType}:`, err);
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
        <QuickInfo data={data as TimestampTextList} />
      </div>
      <div className="text-sm font-medium text-muted-foreground">Options</div>
      <Separator className="mb-3 mt-3" />
      {options && <StepOptions options={options} optionValues={optionValues} onOptionChange={handleOptionChange} />}
      <div className="flex justify-center pt-4">
        <Button onClick={handleGenerate} disabled={isLoading || !data || data.items.length === 0} className="font-bold">
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
    </div>
  );
}

export default GeneratePost;
