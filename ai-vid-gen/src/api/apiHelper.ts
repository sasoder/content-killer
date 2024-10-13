import { TimestampTextList, TimestampText, DescriptionOptions, CommentaryOptions, AudioOptions, AudioResponse } from "@/lib/schema";
import JSZip from "jszip";
import saveAs from "file-saver";
import { GeneratedDataType } from "@/lib/types";

const FASTAPI_URL = import.meta.env.VITE_FASTAPI_URL || "http://localhost:8000";

export const generateDescription = async (url: string, options?: DescriptionOptions): Promise<TimestampTextList> => {
  const response = await fetch(`${FASTAPI_URL}/api/generate_description`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ url, options }),
  });

  if (!response.ok) {
    throw new Error("Failed to generate description");
  }

  const data = await response.json();
  return data as TimestampTextList;
};

export const generateCommentary = async (items: TimestampText[], options?: CommentaryOptions): Promise<TimestampTextList> => {
  console.log(`Generating commentary with options: ${JSON.stringify(options)} and items: ${JSON.stringify(items)}`);
  const response = await fetch(`${FASTAPI_URL}/api/generate_commentary`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ items, options }),
  });

  if (!response.ok) {
    throw new Error("Failed to generate commentary");
  }

  const data = await response.json();
  return data as TimestampTextList;
};

export const generateAudio = async (items: TimestampText[], options?: AudioOptions): Promise<AudioResponse> => {
  const response = await fetch(`${FASTAPI_URL}/api/generate_audio`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ items, options }),
  });

  if (!response.ok) {
    throw new Error("Failed to generate audio");
  }

  const data = await response.json();
  return data as AudioResponse;
};

export const fetchExistingData = async (type: GeneratedDataType) => {
  const response = await fetch(`${FASTAPI_URL}/api/get_${type}`);
  if (!response.ok) {
    throw new Error("Failed to fetch data");
  }
  return response.json();
};

export const getAudioClip = async (filename: string): Promise<Blob> => {
  const response = await fetch(`${FASTAPI_URL}/api/get_audio_clip/${filename}`, {
    method: "GET",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch audio clip");
  }

  return response.blob();
};

export const downloadAllAudio = async (audioFiles: AudioResponse) => {
  const audioClips = await Promise.all(audioFiles.items.map((file) => getAudioClip(file)));
  const zip = new JSZip();
  audioClips.forEach((clip, index) => {
    zip.file(`audio_${index}.mp3`, clip);
  });
  const blob = await zip.generateAsync({ type: "blob" });
  saveAs(blob, "audio.zip");
};
