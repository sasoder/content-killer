"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface AudioFile {
  timestamp: string;
  filename: string;
}

interface AudioDownloaderProps {
  audioFiles: AudioFile[] | null;
}

export default function AudioDownloader({ audioFiles }: AudioDownloaderProps) {
  const [isPlaying, setIsPlaying] = useState<string | null>(null);

  const handlePlay = (filename: string) => {
    setIsPlaying(filename);
    const audio = new Audio(`/api/audio/${filename}`);
    audio.play();
    audio.onended = () => setIsPlaying(null);
  };
  const noAudioFiles = !audioFiles || audioFiles.length === 0;

  return (
    <div className="flex flex-col items-center justify-between gap-4">
      <div className="flex justify-start">
        {noAudioFiles ? (
          <p className="text-sm text-gray-500">No audio files generated yet.</p>
        ) : (
          <>
            <p>Generated {audioFiles.length} audio files:</p>
          </>
        )}
        <ul>
          {audioFiles?.map((file) => (
            <li key={file.filename} className="flex items-center justify-between">
              <span>{file.timestamp}</span>
              <Button onClick={() => handlePlay(file.filename)} disabled={isPlaying === file.filename}>
                {isPlaying === file.filename ? "Playing..." : "Play"}
              </Button>
            </li>
          ))}
        </ul>
      </div>
      <Button
        className="flex justify-center"
        disabled={noAudioFiles}
        onClick={() => {
          // Implement download all functionality
        }}
      >
        Download All
      </Button>
    </div>
  );
}
