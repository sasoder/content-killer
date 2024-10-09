"use client";

import React, { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { TimestampDescriptionList } from "@/lib/types";
import QuickInfo from "@/components/QuickInfo";

interface GeneratePostProps {
  dataType: "description" | "commentary";
  apiRoute: string;
  data: TimestampDescriptionList | null;
  setData: React.Dispatch<React.SetStateAction<TimestampDescriptionList | null>>;
}

function GeneratePost({ dataType, apiRoute, data, setData }: GeneratePostProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

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
        body: JSON.stringify(data),
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
    <div className="flex flex-col justify-between">
      <QuickInfo data={data} dataType={dataType} />
      <div className="flex justify-center mt-4">
        <Button onClick={handleSubmit} disabled={isLoading || !data}>
          {isLoading ? "Generating..." : `Generate`}
        </Button>
      </div>
    </div>
  );
}

export default GeneratePost;
