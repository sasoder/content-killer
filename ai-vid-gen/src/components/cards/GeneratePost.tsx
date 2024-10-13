"use client";

import React, { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { TimestampTextList, GenerateOptions } from "@/lib/types";
import { Icons } from "@/components/icons";
import QuickInfo from "@/components/QuickInfo";
import { Separator } from "@/components/ui/separator";
import StepOptions from "@/components/cards/StepOptions";

interface GeneratePostProps {
  dataType: "description" | "commentary";
  apiRoute: string;
  data: TimestampTextList | null;
  setData: React.Dispatch<React.SetStateAction<TimestampTextList | null>>;
  options?: GenerateOptions;
}

function GeneratePost({ dataType, apiRoute, data, setData, options }: GeneratePostProps) {
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

  const handleSubmit = async () => {
    if (!data) {
      toast({
        title: "Error",
        description: "No data available to generate post.",
        variant: "destructive",
      });
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch(apiRoute, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ data, options: optionValues }),
      });
      if (!response.ok) {
        throw new Error("Failed to generate post");
      }
      const generatedData = await response.json();
      setData(generatedData);
      toast({
        title: "Success",
        description: "Post generated successfully.",
      });
    } catch (error) {
      console.error("Error generating post:", error);
      toast({
        title: "Error",
        description: "Failed to generate post. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-grow">
        <QuickInfo data={data} dataType={dataType} />
      </div>
      <div className="text-sm font-medium text-muted-foreground">Options</div>
      <Separator className="mb-4 mt-3" />
      {options && <StepOptions options={options} optionValues={optionValues} onOptionChange={handleOptionChange} />}
      <div className="flex justify-center pt-4">
        <Button onClick={handleSubmit} disabled={isLoading || !data}>
          {isLoading ? <Icons.loader className="h-[1.2rem] w-[1.2rem] animate-spin" /> : "Generate"}
        </Button>
      </div>
    </div>
  );
}

export default GeneratePost;
