import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface ToolbarButtonProps {
  onClick?: () => void;
  isActive: boolean;
  icon?: React.ElementType | null;
  label: string;
  shortcut?: string;
  className?: string;
}

export const ToolbarButton = ({
  onClick,
  isActive,
  icon: Icon,
  label,
  shortcut,
  className,
}: ToolbarButtonProps) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "h-8 w-8 p-0",
          isActive ? "bg-muted text-primary" : "text-muted-foreground",
          className
        )}
        onClick={onClick}
        type="button"
      >
        {Icon && <Icon className="h-4 w-4" />}
      </Button>
    </TooltipTrigger>
    <TooltipContent side="top" className="flex items-center gap-2">
      <span>{label}</span>
      {shortcut && (
        <span className="text-xs text-muted-foreground bg-muted px-1 rounded">
          {shortcut}
        </span>
      )}
    </TooltipContent>
  </Tooltip>
);
