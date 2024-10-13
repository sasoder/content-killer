import { TimestampTextList } from "@/lib/types";

interface GenerateDescriptionOptions {
  sample?: boolean;
}

interface GenerateCommentaryOptions {
  intro?: boolean;
  outro?: boolean;
  temperature?: number;
}

interface GenerateAudioOptions {
  speed?: number;
}

const FASTAPI_URL = import.meta.env.VITE_FASTAPI_URL || "http://localhost:8000";

export const generateDescription = async (url: string, options?: GenerateDescriptionOptions): Promise<TimestampTextList> => {
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

export const generateCommentary = async (
  description: TimestampTextList,
  options?: GenerateCommentaryOptions
): Promise<TimestampTextList> => {
  const response = await fetch(`${FASTAPI_URL}/api/generate_commentary`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ description, options }),
  });

  if (!response.ok) {
    throw new Error("Failed to generate commentary");
  }

  const data = await response.json();
  return data as TimestampTextList;
};

export const generateAudio = async (commentary: TimestampTextList, options?: GenerateAudioOptions): Promise<AudioFile[]> => {
  const response = await fetch(`${FASTAPI_URL}/api/generate_audio`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ commentary, options }),
  });

  if (!response.ok) {
    throw new Error("Failed to generate audio");
  }

  const data = await response.json();
  return data.files as AudioFile[];
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
