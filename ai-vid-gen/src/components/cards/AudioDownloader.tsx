import { Button } from "@/components/ui/button";
import { AudioResponse } from "@/lib/schema";
import { downloadAllAudio } from "@/api/apiHelper";

interface AudioDownloaderProps {
  audioFiles: AudioResponse;
}

export default function AudioDownloader({ audioFiles }: AudioDownloaderProps) {
  const noAudioFiles = !audioFiles || audioFiles.items.length === 0;

  const handleDownload = (audioResponse: AudioResponse) => {
    downloadAllAudio(audioResponse);
  };

  return (
    <div className="flex h-full flex-col items-center justify-between gap-4">
      <div className="flex justify-start">
        {noAudioFiles ? (
          <p className="text-sm text-gray-500">No audio files generated yet.</p>
        ) : (
          <>
            <p>Generated {audioFiles.items.length} audio files:</p>
            {audioFiles.items.map((file) => (
              <p key={file}>{file}</p>
            ))}
          </>
        )}
      </div>
      <Button
        className="flex justify-center"
        disabled={noAudioFiles}
        onClick={() => {
          handleDownload(audioFiles);
        }}
      >
        Download All
      </Button>
    </div>
  );
}
