import { Editor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import {
  Link as LinkIcon,
  Highlighter,
  Palette,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  colors,
  getMenuConfigs,
  getToolbarButtons,
  getCodeButtons,
  type MenuId,
  type MenuConfig,
} from "./helper";
import { ToolbarButton } from "./ToolbarButton";

interface FloatingToolbarProps {
  editor: Editor;
}

export const FloatingToolbar = ({ editor }: FloatingToolbarProps) => {
  const [linkUrl, setLinkUrl] = useState("");
  const [openMenuId, setOpenMenuId] = useState<MenuId | null>(null);

  const closeMenu = () => setOpenMenuId(null);
  const isMenuOpen = (menuId: MenuId) => openMenuId === menuId;
  const toggleMenu = (menuId: MenuId) => (open: boolean) => {
    setOpenMenuId(open ? menuId : null);
  };

  const setLink = () => {
    if (linkUrl) {
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: linkUrl })
        .run();
    } else {
      editor.chain().focus().unsetLink().run();
    }
    closeMenu();
    setLinkUrl("");
  };

  const menuConfigs = getMenuConfigs(editor);
  const toolbarButtons = getToolbarButtons(editor);
  const codeButtons = getCodeButtons(editor);

  const shouldShow = ({ from, to }: { from: number; to: number }) =>
    from !== to;

  const MenuItem = ({
    onClick,
    isActive,
    icon: Icon,
    label,
    style,
  }: {
    onClick: () => void;
    isActive: boolean;
    icon?: React.ElementType | null;
    label: string;
    style?: React.CSSProperties;
  }) => (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center w-full px-3 py-2 text-sm hover:bg-muted rounded-sm transition-colors",
        isActive && "bg-muted font-semibold"
      )}
      style={style}
      type="button"
    >
      {Icon && <Icon className="mr-2 h-4 w-4" />}
      {label}
    </button>
  );

  const renderMenu = (config: MenuConfig) => {
    if (config.customContent) {
      return (
        <Popover
          key={config.id}
          open={isMenuOpen(config.id)}
          onOpenChange={toggleMenu(config.id)}
        >
          <PopoverTrigger asChild>
            <div>
              <ToolbarButton
                isActive={false}
                icon={config.trigger.icon || null}
                label={config.trigger.label || ""}
              />
            </div>
          </PopoverTrigger>
          <PopoverContent
            className="w-60 p-2"
            align={config.align || "start"}
            side="top"
          >
            {config.customContent}
          </PopoverContent>
        </Popover>
      );
    }

    return (
      <Popover
        key={config.id}
        open={isMenuOpen(config.id)}
        onOpenChange={toggleMenu(config.id)}
      >
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-8 px-2 text-sm font-normal text-muted-foreground",
              config.trigger.width,
              config.trigger.showChevron ? "gap-1" : "w-8 p-0",
              config.trigger.getValue && "justify-between"
            )}
            type="button"
          >
            {config.trigger.getValue ? (
              <>
                <span className="truncate">{config.trigger.getValue()}</span>
                {config.trigger.showChevron && (
                  <ChevronDown className="h-3 w-3 ml-1" />
                )}
              </>
            ) : (
              <>
                {config.trigger?.icon && (
                  <config.trigger.icon className="h-4 w-4" />
                )}
                {config.trigger.showChevron && (
                  <ChevronDown className="h-3 w-3" />
                )}
              </>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className={cn("p-2", config.width)}
          align={config.align || "start"}
          side="top"
        >
          {config.sections?.map((section, sectionIdx) => (
            <div key={sectionIdx}>
              {section.title && (
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                  {section.title}
                </div>
              )}
              {section.items.map((item, itemIdx) => (
                <MenuItem
                  key={itemIdx}
                  onClick={() => {
                    item.action();
                    closeMenu();
                  }}
                  isActive={item.isActive}
                  icon={item.icon}
                  label={item.label}
                  style={item.style}
                />
              ))}
              {sectionIdx < (config.sections?.length || 0) - 1 && (
                <div className="h-px bg-border my-1" />
              )}
            </div>
          ))}
        </PopoverContent>
      </Popover>
    );
  };

  return (
    <TooltipProvider>
      <BubbleMenu
        editor={editor}
        shouldShow={shouldShow}
        className="flex items-center gap-1 p-1 rounded-lg border bg-background shadow-lg overflow-hidden max-w-[90vw] flex-wrap"
      >
        {/* Dynamic Menus */}
        {menuConfigs.map((config) => renderMenu(config))}

        <div className="w-px h-4 bg-border mx-1" />

        {/* Toolbar Buttons - Text Formatting */}
        {toolbarButtons.map((button, idx) => (
          <ToolbarButton
            key={idx}
            onClick={button.action}
            isActive={button.isActive}
            icon={button.icon}
            label={button.label}
            shortcut={button.shortcut}
          />
        ))}

        <div className="w-px h-4 bg-border mx-1" />

        {/* Code Buttons */}
        {codeButtons.map((button, idx) => (
          <ToolbarButton
            key={idx}
            onClick={button.action}
            isActive={button.isActive}
            icon={button.icon}
            label={button.label}
            shortcut={button.shortcut}
          />
        ))}

        <div className="w-px h-4 bg-border mx-1" />

        {/* Link Menu */}
        <Popover open={isMenuOpen("link")} onOpenChange={toggleMenu("link")}>
          <PopoverTrigger asChild>
            <div>
              <ToolbarButton
                isActive={editor.isActive("link")}
                icon={LinkIcon}
                label="Link"
                shortcut="Cmd+K"
              />
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-60 p-2" align="start" side="top">
            <div className="flex gap-2">
              <Input
                placeholder="https://example.com"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setLink();
                  }
                }}
                className="h-8"
              />
              <Button size="sm" onClick={setLink} className="h-8" type="button">
                Set
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          isActive={editor.isActive("highlight")}
          icon={Highlighter}
          label="Highlight"
          shortcut="Cmd+Shift+H"
        />

        {/* Color Menu */}
        <Popover open={isMenuOpen("color")} onOpenChange={toggleMenu("color")}>
          <PopoverTrigger asChild>
            <div>
              <ToolbarButton
                isActive={false}
                icon={Palette}
                label="Text Color"
              />
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-40 p-2" align="start" side="top">
            <div className="grid grid-cols-5 gap-1">
              {colors.map((color) => (
                <button
                  key={color}
                  className="w-6 h-6 rounded-full border hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                  onClick={() => {
                    editor.chain().focus().setColor(color).run();
                    closeMenu();
                  }}
                  type="button"
                />
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </BubbleMenu>
    </TooltipProvider>
  );
};
