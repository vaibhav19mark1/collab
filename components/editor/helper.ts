import { Editor } from "@tiptap/react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  TerminalSquare,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Subscript,
  Superscript,
  MoreHorizontal,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Pilcrow,
} from "lucide-react";

export type MenuId =
  | "hierarchy"
  | "fontFamily"
  | "fontSize"
  | "link"
  | "color"
  | "more";

export interface MenuConfig {
  id: MenuId;
  trigger: {
    icon?: React.ElementType | null;
    label?: string;
    showChevron?: boolean;
    width?: string;
    getValue?: () => string;
  };
  align?: "start" | "center" | "end";
  width?: string;
  sections?: Array<{
    title?: string;
    items: Array<{
      icon?: React.ElementType;
      label: string;
      action: () => void;
      isActive: boolean;
      style?: React.CSSProperties;
    }>;
  }>;
  customContent?: React.ReactNode;
}

export const colors = [
  "#000000",
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#84cc16",
  "#22c55e",
  "#06b6d4",
  "#3b82f6",
  "#6366f1",
  "#a855f7",
  "#ec4899",
];

export const fontFamilies = [
  { name: "Inter", value: "Inter" },
  { name: "Serif", value: "serif" },
  { name: "Monospace", value: "monospace" },
  { name: "Sans Serif", value: "sans-serif" },
  { name: "Comic Sans", value: "Comic Sans MS, Comic Sans" },
];

export const fontSizes = [
  { name: "Smaller", value: "12px" },
  { name: "Small", value: "14px" },
  { name: "Medium", value: "16px" },
  { name: "Large", value: "20px" },
  { name: "Extra Large", value: "24px" },
];

export const getMenuConfigs = (editor: Editor): MenuConfig[] => {
  // Determine the active hierarchy icon
  const getActiveHierarchyIcon = () => {
    if (editor.isActive("heading", { level: 1 })) return Heading1;
    if (editor.isActive("heading", { level: 2 })) return Heading2;
    if (editor.isActive("heading", { level: 3 })) return Heading3;
    if (editor.isActive("bulletList")) return List;
    if (editor.isActive("orderedList")) return ListOrdered;
    return Pilcrow;
  };

  return [
    {
      id: "hierarchy",
      trigger: {
        icon: getActiveHierarchyIcon(),
        showChevron: true,
      },
      width: "w-48",
      sections: [
        {
          title: "Hierarchy",
          items: [
            {
              icon: Pilcrow,
              label: "Paragraph",
              action: () => editor.chain().focus().setParagraph().run(),
              isActive: editor.isActive("paragraph"),
            },
            {
              icon: Heading1,
              label: "Heading 1",
              action: () =>
                editor.chain().focus().toggleHeading({ level: 1 }).run(),
              isActive: editor.isActive("heading", { level: 1 }),
            },
            {
              icon: Heading2,
              label: "Heading 2",
              action: () =>
                editor.chain().focus().toggleHeading({ level: 2 }).run(),
              isActive: editor.isActive("heading", { level: 2 }),
            },
            {
              icon: Heading3,
              label: "Heading 3",
              action: () =>
                editor.chain().focus().toggleHeading({ level: 3 }).run(),
              isActive: editor.isActive("heading", { level: 3 }),
            },
          ],
        },
        {
          title: "Lists",
          items: [
            {
              icon: List,
              label: "Bullet List",
              action: () => editor.chain().focus().toggleBulletList().run(),
              isActive: editor.isActive("bulletList"),
            },
            {
              icon: ListOrdered,
              label: "Numbered List",
              action: () => editor.chain().focus().toggleOrderedList().run(),
              isActive: editor.isActive("orderedList"),
            },
          ],
        },
      ],
    },
    {
      id: "fontFamily",
      trigger: {
        width: "w-24",
        getValue: () =>
          fontFamilies.find(
            (f) => editor.getAttributes("textStyle").fontFamily === f.value
          )?.name || "Font",
        showChevron: true,
      },
      width: "w-40",
      sections: [
        {
          items: [
            ...fontFamilies.map((font) => ({
              label: font.name,
              action: () =>
                editor.chain().focus().setFontFamily(font.value).run(),
              isActive: editor.isActive("textStyle", {
                fontFamily: font.value,
              }),
              style: { fontFamily: font.value },
            })),
            {
              label: "Default",
              action: () => editor.chain().focus().unsetFontFamily().run(),
              isActive: false,
            },
          ],
        },
      ],
    },
    {
      id: "fontSize",
      trigger: {
        width: "w-24",
        getValue: () =>
          fontSizes.find(
            (s) => editor.getAttributes("textStyle").fontSize === s.value
          )?.name || "Size",
        showChevron: true,
      },
      width: "w-36",
      sections: [
        {
          items: [
            ...fontSizes.map((size) => ({
              label: size.name,
              action: () =>
                editor.chain().focus().setFontSize(size.value).run(),
              isActive: editor.isActive("textStyle", { fontSize: size.value }),
            })),
            {
              label: "Default",
              action: () => editor.chain().focus().unsetFontSize().run(),
              isActive: false,
            },
          ],
        },
      ],
    },
    {
      id: "more",
      trigger: {
        icon: MoreHorizontal,
      },
      width: "w-48",
      align: "end",
      sections: [
        {
          items: [
            {
              icon: Subscript,
              label: "Subscript",
              action: () => editor.chain().focus().toggleSubscript().run(),
              isActive: editor.isActive("subscript"),
            },
            {
              icon: Superscript,
              label: "Superscript",
              action: () => editor.chain().focus().toggleSuperscript().run(),
              isActive: editor.isActive("superscript"),
            },
          ],
        },
        {
          items: [
            {
              icon: AlignLeft,
              label: "Align Left",
              action: () => editor.chain().focus().setTextAlign("left").run(),
              isActive: editor.isActive({ textAlign: "left" }),
            },
            {
              icon: AlignCenter,
              label: "Align Center",
              action: () => editor.chain().focus().setTextAlign("center").run(),
              isActive: editor.isActive({ textAlign: "center" }),
            },
            {
              icon: AlignRight,
              label: "Align Right",
              action: () => editor.chain().focus().setTextAlign("right").run(),
              isActive: editor.isActive({ textAlign: "right" }),
            },
            {
              icon: AlignJustify,
              label: "Justify",
              action: () =>
                editor.chain().focus().setTextAlign("justify").run(),
              isActive: editor.isActive({ textAlign: "justify" }),
            },
          ],
        },
      ],
    },
  ];
};

export const getToolbarButtons = (editor: Editor) => [
  {
    icon: Bold,
    label: "Bold",
    shortcut: "Cmd+B",
    action: () => editor.chain().focus().toggleBold().run(),
    isActive: editor.isActive("bold"),
  },
  {
    icon: Italic,
    label: "Italic",
    shortcut: "Cmd+I",
    action: () => editor.chain().focus().toggleItalic().run(),
    isActive: editor.isActive("italic"),
  },
  {
    icon: Underline,
    label: "Underline",
    shortcut: "Cmd+U",
    action: () => editor.chain().focus().toggleUnderline().run(),
    isActive: editor.isActive("underline"),
  },
  {
    icon: Strikethrough,
    label: "Strikethrough",
    shortcut: "Cmd+Shift+X",
    action: () => editor.chain().focus().toggleStrike().run(),
    isActive: editor.isActive("strike"),
  },
];

export const getCodeButtons = (editor: Editor) => [
  {
    icon: Code,
    label: "Code",
    shortcut: "Cmd+E",
    action: () => editor.chain().focus().toggleCode().run(),
    isActive: editor.isActive("code"),
  },
  {
    icon: TerminalSquare,
    label: "Code Block",
    shortcut: "Cmd+Alt+C",
    action: () => editor.chain().focus().toggleCodeBlock().run(),
    isActive: editor.isActive("codeBlock"),
  },
];
