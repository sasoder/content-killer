import { TimestampTextList } from "@/lib/types";

interface QuickInfoProps {
  data: TimestampTextList | null;
}

export default function QuickInfo({ data }: QuickInfoProps) {
  if (!data || data.items.length === 0) {
    return <p className="text-sm text-gray-500">No data to display.</p>;
  }

  const listLength = data.items.length;
  const totalWords = data.items.reduce((total, item) => total + item.text.split(" ").length, 0);

  return (
    <div className=" h-full overflow-auto">
      <p className="mt-2 text-sm text-gray-500">
        You have {listLength} data {listLength === 1 ? "entry" : "entries"} consisting of {totalWords} {totalWords === 1 ? "word" : "words"}
        .
      </p>
    </div>
  );
}
