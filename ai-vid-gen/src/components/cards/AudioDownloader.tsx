import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AudioResponse } from "../../lib/schema";

interface AudioDownloaderProps {
  audioFiles: AudioResponse | null;
}

export default function AudioDownloader({ audioFiles }: AudioDownloaderProps) {
  const [isPlaying, setIsPlaying] = useState<string | null>(null);

  const handlePlay = (filename: string) => {
    setIsPlaying(filename);
    const audio = new Audio(`/api/audio/${filename}`);
    audio.play();
    audio.onended = () => setIsPlaying(null);
  };
  const noAudioFiles = !audioFiles || audioFiles.items.length === 0;

  return (
    <div className="flex flex-col items-center justify-between gap-4">
      <div className="flex justify-start">
        {noAudioFiles ? (
          <p className="text-sm text-gray-500">No audio files generated yet.</p>
        ) : (
          <>
            <p>Generated {audioFiles.items.length} audio files:</p>
          </>
        )}
        <ul>
          {audioFiles?.items.map((file) => (
            <li key={file} className="flex items-center justify-between">
              <span>{file}</span>
              <Button onClick={() => handlePlay(file)} disabled={isPlaying === file}>
                {isPlaying === file ? "Playing..." : "Play"}
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
