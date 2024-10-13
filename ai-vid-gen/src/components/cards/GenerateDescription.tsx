"use client";

import { useState, FormEvent } from "react";
import { useToast } from "@/hooks/use-toast";

import { TimestampTextList } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { generateDescription } from "@/api/apiHelper";
import { Icons } from "@/components/icons";

interface GenerateDescriptionProps {
  setData: (data: TimestampTextList) => void;
}

export default function GenerateDescription({ setData }: GenerateDescriptionProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [url, setUrl] = useState("");
  const { toast } = useToast();

  const validateUrl = (input: string): boolean => {
    try {
      new URL(input);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateUrl(url)) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid URL",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      console.log("Submitting form with URL:", url);
      const descriptionData = await generateDescription(url, { sample: true });
      setData(descriptionData);
      toast({
        title: "Success",
        description: "Description generated successfully.",
      });
    } catch (error) {
      console.error("Error generating content:", error);
      toast({
        title: "Error",
        description: "Failed to generate description. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full">
      <div className="flex-grow">
        <label htmlFor="url" className="block text-sm font-medium text-gray-700">
          YouTube URL
        </label>
        <Input
          id="url"
          type="text"
          placeholder="https://www.example.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="mt-1"
        />
        <p className="mt-2 text-sm text-gray-500">Enter the URL of the YouTube video you want to generate a description for.</p>
      </div>
      <div className="mt-4 flex justify-center">
        <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
          {isLoading ? (
            <>
              <Icons.loader className="h-[1.2rem] w-[1.2rem] animate-spin mr-2" />
              Generating...
            </>
          ) : (
            "Generate description"
          )}
        </Button>
      </div>
    </form>
  );
}
