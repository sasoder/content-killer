import useSWR from "swr";
import { TimestampTextList, AudioResponse } from "@/lib/schema";
import { GeneratedDataType } from "@/lib/types";

const FASTAPI_URL = import.meta.env.VITE_FASTAPI_URL || "http://localhost:8000";

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to fetch data");
  }
  return response.json();
};

export function useGeneratedData(type: GeneratedDataType) {
  const { data, error, mutate } = useSWR<TimestampTextList | AudioResponse>(`${FASTAPI_URL}/api/get_${type}`, fetcher);
  return {
    data,
    isLoading: !error && !data,
    isError: error,
    mutate,
  };
}
