"use client";

import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Code2, Check } from "lucide-react";
import { SUPPORTED_LANGUAGES } from "@/lib/constants";

interface LanguageSelectorProps {
  currentLanguage: string;
  onLanguageChange: (language: string) => void;
  disabled?: boolean;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  currentLanguage,
  onLanguageChange,
  disabled = false,
}) => {
  const currentLangName =
    SUPPORTED_LANGUAGES.find((lang) => lang.id === currentLanguage)?.name ||
    "TypeScript";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled}
          className="gap-2"
        >
          <Code2 className="h-4 w-4" />
          {currentLangName}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-100 overflow-y-auto">
        {SUPPORTED_LANGUAGES.map((lang) => (
          <DropdownMenuItem
            key={lang.id}
            onClick={() => onLanguageChange(lang.id)}
            className="gap-2"
          >
            {currentLanguage === lang.id && (
              <Check className="h-4 w-4 text-primary" />
            )}
            <span className={currentLanguage !== lang.id ? "ml-6" : ""}>
              {lang.name}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
