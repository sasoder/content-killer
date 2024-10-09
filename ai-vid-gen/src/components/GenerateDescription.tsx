"use client";

import { useState, FormEvent } from "react";

import { DescriptionList } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const FASTAPI_URL = import.meta.env.VITE_FASTAPI_URL;
interface GenerateDescriptionProps {
  setData: (data: DescriptionList) => void;
}

export default function GenerateDescription({ setData }: GenerateDescriptionProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

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
    setError(null);

    if (!validateUrl(url)) {
      setError("Please enter a valid URL");
      return;
    }

    setIsLoading(true);
    try {
      console.log("Submitting form with URL:", url);
      const response = await fetch(FASTAPI_URL + "/api/generate_description", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });
      if (!response.ok) {
        throw new Error("Failed to generate description");
      }
      const descriptionData = await response.json();
      setData(descriptionData as DescriptionList);
    } catch (error) {
      console.error("Error generating content:", error);
      setError("Failed to generate description. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div>
        <label htmlFor="url" className="block text-sm font-medium text-gray-700">
          URL
        </label>
        <Input
          id="url"
          type="text"
          placeholder="https://example.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="mt-1"
        />
        <p className="mt-2 text-sm text-gray-500">Enter the URL of the content you want to generate video for.</p>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>
      <Button type="submit" disabled={isLoading}>
        {isLoading ? "Generating..." : "Generate"}
      </Button>
    </form>
  );
}
