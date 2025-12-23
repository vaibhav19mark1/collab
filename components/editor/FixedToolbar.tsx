import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Editor } from "@tiptap/react";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  ChevronDown,
  Grid2x2Plus,
  Highlighter,
  Link as LinkIcon,
  Palette,
  Rows2,
  Rows3,
  Subscript,
  Superscript,
  Table,
  Trash,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { useDebouncedEditorUpdate } from "@/hooks/useDebouncedEditorUpdate";
import {
  colors,
  getCodeButtons,
  getMenuConfigs,
  getToolbarButtons,
  type MenuConfig,
  type MenuId,
} from "./helper";
import { ToolbarButton } from "./ToolbarButton";

interface FixedToolbarProps {
  editor: Editor;
}

export const FixedToolbar = ({ editor }: FixedToolbarProps) => {
  const [linkUrl, setLinkUrl] = useState("");
  const [openMenuId, setOpenMenuId] = useState<MenuId | null>(null);

  // Force re-render when editor state changes
  useDebouncedEditorUpdate(editor, 300);

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

  const menuConfigs = getMenuConfigs(editor).filter((c) => c.id !== "more");
  const toolbarButtons = getToolbarButtons(editor);
  const codeButtons = getCodeButtons(editor);

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
            className="w-60 p-2 z-9999"
            align={config.align || "start"}
            side="bottom"
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
          className={cn("p-2 z-9999", config.width)}
          align={config.align || "start"}
          side="bottom"
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
    <div className="flex items-center gap-1 p-2 border-b bg-background flex-wrap">
      {/* Dynamic Menus (Hierarchy, Fonts) */}
      {menuConfigs.map((config) => renderMenu(config))}

      <div className="w-px h-4 bg-border mx-1 hidden sm:block" />

      {/* Basic Text Formatting */}
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

      {/* Subscript / Superscript */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleSubscript().run()}
        isActive={editor.isActive("subscript")}
        icon={Subscript}
        label="Subscript"
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleSuperscript().run()}
        isActive={editor.isActive("superscript")}
        icon={Superscript}
        label="Superscript"
      />

      <div className="w-px h-4 bg-border mx-1 hidden sm:block" />

      {/* Alignment */}
      <div className="flex items-center gap-0.5">
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          isActive={editor.isActive({ textAlign: "left" })}
          icon={AlignLeft}
          label="Align Left"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          isActive={editor.isActive({ textAlign: "center" })}
          icon={AlignCenter}
          label="Align Center"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          isActive={editor.isActive({ textAlign: "right" })}
          icon={AlignRight}
          label="Align Right"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("justify").run()}
          isActive={editor.isActive({ textAlign: "justify" })}
          icon={AlignJustify}
          label="Justify"
        />
      </div>

      <div className="w-px h-4 bg-border mx-1 hidden sm:block" />

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

      <div className="w-px h-4 bg-border mx-1 hidden sm:block" />

      {/* Link, Highlight, Color */}
      <div className="flex items-center gap-0.5">
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
          <PopoverContent
            className="w-60 p-2 z-9999"
            align="start"
            side="bottom"
          >
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
          <PopoverContent
            className="w-40 p-2 z-9999"
            align="start"
            side="bottom"
          >
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
      </div>

      <div className="w-px h-4 bg-border mx-1 hidden sm:block" />

      {/* Table Controls */}
      <ToolbarButton
        onClick={() =>
          editor
            .chain()
            .focus()
            .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
            .run()
        }
        isActive={false}
        icon={Table}
        label="Insert Table"
      />

      <div className="w-px h-4 bg-border mx-1" />

      <div className="flex items-center gap-1 animate-in fade-in slide-in-from-left-2 overflow-x-auto no-scrollbar max-w-full">
        <ToolbarButton
          onClick={() => editor.chain().focus().addColumnBefore().run()}
          isActive={false}
          icon={Grid2x2Plus}
          label="Add Column Before"
          iconClassName={"rotate-90"}
          disabled={!editor.isActive("table")}
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().addColumnAfter().run()}
          isActive={false}
          icon={Grid2x2Plus}
          label="Add Column After"
          disabled={!editor.isActive("table")}
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().deleteColumn().run()}
          isActive={false}
          icon={Trash2}
          label="Delete Column"
          disabled={!editor.isActive("table")}
        />
        <div className="w-px h-4 bg-border mx-0.5" />
        <ToolbarButton
          onClick={() => editor.chain().focus().addRowBefore().run()}
          isActive={false}
          icon={Rows2}
          label="Add Row Before"
          disabled={!editor.isActive("table")}
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().addRowAfter().run()}
          isActive={false}
          icon={Rows3}
          label="Add Row After"
          disabled={!editor.isActive("table")}
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().deleteRow().run()}
          isActive={false}
          icon={Trash}
          label="Delete Row"
          disabled={!editor.isActive("table")}
        />
      </div>
    </div>
  );
};
