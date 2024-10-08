"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { CommentaryList, DescriptionList } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

interface GeneratePostProps {
  buttonText: string;
  apiRoute: string;
  data: CommentaryList | DescriptionList | null;
  setData: (data: CommentaryList | DescriptionList) => void;
}

export default function GeneratePost({ buttonText, apiRoute, data, setData }: GeneratePostProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

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
    <div className="flex items-center justify-center">
      <Button onClick={handleGenerate} disabled={isLoading || !data}>
        {isLoading ? "Generating..." : buttonText}
      </Button>
    </div>
  );
}
