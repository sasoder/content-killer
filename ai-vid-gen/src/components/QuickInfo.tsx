import { TimestampDescriptionList } from "@/lib/types";

interface QuickInfoProps {
  data: TimestampDescriptionList | null;
  dataType: "description" | "commentary";
}

export default function QuickInfo({ data, dataType }: QuickInfoProps) {
  if (!data || data.items.length === 0) {
    return null;
  }
  // gets the list length
  const listLength = data.items.length;
  console.log(data);
  const totalWords = data.items.reduce((total, item) => total + item.text.split(" ").length, 0);
  const allTimestamps = data.items
    .reduce((acc, item) => {
      return (
        acc +
        ", " +
        item.timestamp +
        ", " +
        item.timestamp +
        ", " +
        item.timestamp +
        ", " +
        item.timestamp +
        ", " +
        item.timestamp +
        ", " +
        item.timestamp +
        ", " +
        item.timestamp +
        ", " +
        item.timestamp +
        ", " +
        item.timestamp
      );
    }, "")
    .slice(2);
  return (
    <div>
      <p className="mt-2 text-sm text-gray-500">
        You have {listLength} {dataType} entries consisting of {totalWords} words, with timestamps:
      </p>
      <div className="text-sm text-gray-500 mt-2 overflow-auto">{allTimestamps}</div>
    </div>
  );
}
