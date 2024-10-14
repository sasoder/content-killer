import { Button } from "@/components/ui/button";
import { FileResponse } from "@/lib/schema";
import { downloadAll } from "@/api/apiHelper";
import { Separator } from "@radix-ui/react-separator";

interface FileDownloaderProps {
  files: FileResponse;
}

export default function FileDownloader({ files }: FileDownloaderProps) {
  const noFiles = !files || files.items.length === 0;

  const handleDownload = (fileResponse: FileResponse) => {
    downloadAll(fileResponse);
  };

  return (
    <div className="flex h-full flex-col justify-between gap-4">
      <div className="flex flex-col justify-start gap-2">
        {noFiles ? (
          <p className="text-sm text-gray-500">No files generated yet.</p>
        ) : (
          <>
            <p className="text-sm text-gray-500">
              You have {files.items.length} {files.items.length === 1 ? "file" : "files"} ready for download:
            </p>
            <Separator className="mb-2 mt-2" />
            {files.items.map((file) => (
              <p className="text-sm text-gray-500" key={file}>
                {file}
              </p>
            ))}
          </>
        )}
      </div>
      <div className="flex justify-center">
        <Button
          className="flex justify-center"
          disabled={noFiles}
          onClick={() => {
            handleDownload(files);
          }}
        >
          Download All
        </Button>
      </div>
    </div>
  );
}
