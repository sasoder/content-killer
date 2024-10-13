import { Icons } from "@/components/icons";
import JsonEditor from "@/components/JsonEditor";
import { TimestampTextList } from "@/lib/schema";

type StepTransitionProps = {
  data: TimestampTextList | null;
  jsonEditorTitle: string | null;
  onUpdate: ((updatedData: TimestampTextList | null) => void) | null;
};

function StepTransition({ data, jsonEditorTitle, onUpdate }: StepTransitionProps) {
  return (
    <div className="flex flex-col items-center justify-center">
      <Icons.moveRight className="h-8 w-8" strokeWidth={0.8} color="gray" />
      {data && data.items.length > 0 && (
        <div className="absolute pt-24 ">
          <JsonEditor title={jsonEditorTitle as string} data={data} onUpdate={onUpdate as (updatedData: TimestampTextList) => void} />
        </div>
      )}
    </div>
  );
}

export default StepTransition;
