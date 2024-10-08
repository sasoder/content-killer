"use client";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

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
