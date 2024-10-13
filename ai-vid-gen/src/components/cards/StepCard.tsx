import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Icons } from "@/components/icons";
type StepCardProps = {
  title: string;
  content: React.ReactNode;
  info: string;
};

function StepCard({ title, content, info }: StepCardProps) {
  return (
    <Card className="w-1/4 h-[500px] flex flex-col shadow-xl shadow-black/20">
      <CardHeader>
        <CardTitle className="flex flex-row items-center justify-between">
          {title}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Icons.info className="w-4 h-4 opacity-70 hover:opacity-100 cursor-pointer transition-opacity duration-300" />
              </TooltipTrigger>
              <TooltipContent side="top" sideOffset={10}>
                <p>{info}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col gap-2">{content}</CardContent>
    </Card>
  );
}

export default StepCard;
