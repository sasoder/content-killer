import { TimestampTextList } from "@/lib/types";

interface QuickInfoProps {
  data: TimestampTextList | null;
  dataType: "description" | "commentary";
}

export default function QuickInfo({ data, dataType }: QuickInfoProps) {
  if (!data || data.items.length === 0) {
    return <p className="text-sm text-gray-500">No data to display.</p>;
  }

  const listLength = data.items.length;
  const totalWords = data.items.reduce((total, item) => total + item.text.split(" ").length, 0);
  const allTimestamps = data.items
    .reduce((acc, item) => {
      return acc + ", " + item.timestamp;
    }, "")
    .slice(2);
  return (
    <div className=" h-full overflow-auto">
      <p className="mt-2 text-sm text-gray-500">
        You have {listLength} {dataType} entries consisting of {totalWords} words, with timestamps:
      </p>
      <div className="text-sm text-gray-500 mt-2">{allTimestamps}</div>
    </div>
  );
}
