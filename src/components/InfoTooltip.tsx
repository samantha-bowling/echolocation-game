import { HelpCircle } from 'lucide-react';
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface InfoTooltipProps {
  content: React.ReactNode;
}

export function InfoTooltip({ content }: InfoTooltipProps) {
  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <HelpCircle className="w-3.5 h-3.5 text-muted-foreground/60 hover:text-foreground transition-colors cursor-help" />
        </TooltipTrigger>
        <TooltipPrimitive.Portal>
          <TooltipContent side="top" className="max-w-xs">
            <div className="text-xs">{content}</div>
          </TooltipContent>
        </TooltipPrimitive.Portal>
      </Tooltip>
    </TooltipProvider>
  );
}
