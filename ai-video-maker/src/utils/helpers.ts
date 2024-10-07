import { toast } from "@/hooks/use-toast"

export function timestampToFilename(timestamp: string): string {
  return timestamp.replace(":", "") + ".mp3"
}
