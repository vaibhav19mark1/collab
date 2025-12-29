"use client";

import { ActiveUsers } from "@/components/shared/ActiveUsers";
import { BackToRoomButton } from "@/components/shared/BackToRoomButton";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Participant } from "@/types/room.types";
import {
  Check,
  Copy,
  Download,
  Maximize2,
  Minimize2,
  RotateCcw,
} from "lucide-react";
import React from "react";
import { WebsocketProvider } from "y-websocket";
import { LanguageSelector } from "./LanguageSelector";

interface MonacoToolbarProps {
  language: string;
  onLanguageChange: (language: string) => void;
  onDownload?: () => void;
  onCopy?: () => void;
  onReset?: () => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  disabled?: boolean;
  documentTitle?: string;
  roomId: string;
  participants?: Participant[];
  provider: WebsocketProvider | null;
  isConnected: boolean;
}

export const MonacoToolbar: React.FC<MonacoToolbarProps> = ({
  language,
  onLanguageChange,
  onDownload,
  onCopy,
  onReset,
  isFullscreen = false,
  onToggleFullscreen,
  disabled = false,
  documentTitle,
  roomId,
  participants = [],
  provider,
  isConnected,
}) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    if (onCopy) {
      onCopy();
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/30">
      <div className="flex items-center gap-3">
        <LanguageSelector
          currentLanguage={language}
          onLanguageChange={onLanguageChange}
          disabled={disabled}
        />
        <h1 className="text-sm font-semibold truncate max-w-50 sm:max-w-75">
          {documentTitle}
        </h1>
        <span className="text-xs text-muted-foreground">
          {isConnected ? "Saved" : "Unsaved changes"}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {onCopy && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopy}
                  disabled={disabled}
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Copy code</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {onDownload && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDownload}
                  disabled={disabled}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Download code</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {onReset && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onReset}
                  disabled={disabled}
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Reset code</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {onToggleFullscreen && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onToggleFullscreen}
                  disabled={disabled}
                >
                  {isFullscreen ? (
                    <Minimize2 className="h-4 w-4" />
                  ) : (
                    <Maximize2 className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        <div className="flex items-center gap-4 border-l pl-4 h-8">
          <ActiveUsers
            provider={provider}
            participants={participants}
            maxDisplay={3}
          />
          <BackToRoomButton roomId={roomId} />
        </div>
      </div>
    </div>
  );
};
