import { Icons } from "@/components/icons";
import JsonEditor from "@/components/JsonEditor";
import { TimestampTextList } from "@/lib/types";

type StepTransitionProps = {
  data: TimestampTextList;
  jsonEditorTitle: string;
  onUpdate: (updatedData: TimestampTextList) => void;
};

function StepTransition({ data, jsonEditorTitle, onUpdate }: StepTransitionProps) {
  return (
    <div className="flex flex-col items-center justify-center">
      <Icons.moveRight className="h-8 w-8" strokeWidth={0.8} color="gray" />
      {data && (
        <div className="absolute pt-24 ">
          <JsonEditor title={jsonEditorTitle} data={data} onUpdate={onUpdate} />
        </div>
      )}
    </div>
  );
}

export default StepTransition;
