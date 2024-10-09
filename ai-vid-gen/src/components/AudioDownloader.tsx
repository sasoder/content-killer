"use client";

import { Button } from "@/components/ui/button";

interface AudioDownloaderProps {
  audioFiles: string[];
}

export default function AudioDownloader({ audioFiles }: AudioDownloaderProps) {
  const disabled: boolean = audioFiles?.length === 0;

  return (
    <div>
      <Button disabled={disabled}>Download Files</Button>
    </div>
  );
}
