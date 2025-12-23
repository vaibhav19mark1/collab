import { Extension, Editor } from "@tiptap/react";
import Suggestion from "@tiptap/suggestion";
import {
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  SquareCheck,
  Code,
  Type,
} from "lucide-react";
import { ReactRenderer } from "@tiptap/react";
import tippy from "tippy.js";
import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { Button } from "@/components/ui/button";

// Type definitions
interface CommandListProps {
  items: CommandItem[];
  command: (item: CommandItem) => void;
}

interface CommandItem {
  title: string;
  description: string;
  searchTerms: string[];
  icon: React.ElementType;
  command: (props: CommandProps) => void;
}

interface CommandProps {
  editor: Editor;
  range: { from: number; to: number };
}

interface KeyDownProps {
  event: KeyboardEvent;
}

const CommandList = forwardRef<{ onKeyDown: (props: KeyDownProps) => boolean }, CommandListProps>((props, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectItem = (index: number) => {
    const item = props.items[index];

    if (item) {
      props.command(item);
    }
  };

  useEffect(() => {
    setSelectedIndex(0);
  }, [props.items]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      if (event.key === "ArrowUp") {
        setSelectedIndex(
          (selectedIndex + props.items.length - 1) % props.items.length
        );
        return true;
      }

      if (event.key === "ArrowDown") {
        setSelectedIndex((selectedIndex + 1) % props.items.length);
        return true;
      }

      if (event.key === "Enter") {
        selectItem(selectedIndex);
        return true;
      }

      return false;
    },
  }));

  return (
    <div className="z-50 min-w-45 overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2">
      <div className="flex flex-col gap-0.5">
        {props.items.length ? (
          props.items.map((item: CommandItem, index: number) => (
            <Button
              key={index}
              variant="ghost"
              className={`flex items-center justify-start gap-2 h-auto py-2 px-3 text-sm font-normal rounded-sm ${
                index === selectedIndex
                  ? "bg-muted text-accent-foreground"
                  : "hover:bg-transparent"
              }`}
              onClick={() => selectItem(index)}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-md border border-muted bg-background">
                <item.icon className="h-4 w-4" />
              </div>
              <div className="flex flex-col items-start gap-0.5">
                <span className="text-sm font-medium">{item.title}</span>
                {/* <span className="text-xs text-muted-foreground">
                  {item.description}
                </span> */}
              </div>
            </Button>
          ))
        ) : (
          <div className="p-2 text-sm text-muted-foreground text-center">
            No result
          </div>
        )}
      </div>
    </div>
  );
});

CommandList.displayName = "CommandList";

const getSuggestionItems = ({ query }: { query: string }) => {
  return [
    {
      title: "Text",
      description: "Just start typing with plain text.",
      searchTerms: ["p", "paragraph"],
      icon: Type,
      command: ({ editor, range }: CommandProps) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .toggleNode("paragraph", "paragraph")
          .run();
      },
    },
    {
      title: "Heading 1",
      description: "Big section heading.",
      searchTerms: ["h1", "heading1", "header"],
      icon: Heading1,
      command: ({ editor, range }: CommandProps) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .setNode("heading", { level: 1 })
          .run();
      },
    },
    {
      title: "Heading 2",
      description: "Medium section heading.",
      searchTerms: ["h2", "heading2", "subheading"],
      icon: Heading2,
      command: ({ editor, range }: CommandProps) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .setNode("heading", { level: 2 })
          .run();
      },
    },
    {
      title: "Heading 3",
      description: "Small section heading.",
      searchTerms: ["h3", "heading3", "subtitle"],
      icon: Heading3,
      command: ({ editor, range }: CommandProps) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .setNode("heading", { level: 3 })
          .run();
      },
    },
    {
      title: "Bullet List",
      description: "Create a simple bullet list.",
      searchTerms: ["unordered", "point"],
      icon: List,
      command: ({ editor, range }: CommandProps) => {
        editor.chain().focus().deleteRange(range).toggleBulletList().run();
      },
    },
    {
      title: "Numbered List",
      description: "Create a list with numbering.",
      searchTerms: ["ordered"],
      icon: ListOrdered,
      command: ({ editor, range }: CommandProps) => {
        editor.chain().focus().deleteRange(range).toggleOrderedList().run();
      },
    },
    {
      title: "To-do List",
      description: "Track tasks with a to-do list.",
      searchTerms: ["todo", "task", "list", "check", "square"],
      icon: SquareCheck,
      command: ({ editor, range }: CommandProps) => {
        editor.chain().focus().deleteRange(range).toggleTaskList().run();
      },
    },
    {
      title: "Code Block",
      description: "Capture a code snippet.",
      searchTerms: ["codeblock"],
      icon: Code,
      command: ({ editor, range }: CommandProps) => {
        editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
      },
    },
  ]
    .filter((item) => {
      if (typeof query === "string" && query.length > 0) {
        const search = query.toLowerCase();
        return (
          item.title.toLowerCase().includes(search) ||
          item.searchTerms.some((term) => term.includes(search))
        );
      }
      return true;
    })
    .slice(0, 10);
};

interface RenderItemsProps {
  clientRect: () => DOMRect;
  editor: Editor;
  items: CommandItem[];
  command: (item: CommandItem) => void;
}

interface RenderItemsEventProps {
  event: KeyboardEvent;
}

const renderItems = () => {
  let component: ReactRenderer | null = null;
  let popup: ReturnType<typeof tippy> | null = null;

  return {
    onStart: (props: RenderItemsProps) => {
      component = new ReactRenderer(CommandList, {
        props,
        editor: props.editor,
      });

      if (!props.clientRect) {
        return;
      }

      popup = tippy("body", {
        getReferenceClientRect: props.clientRect,
        appendTo: () => document.body,
        content: component.element,
        showOnCreate: true,
        interactive: true,
        trigger: "manual",
        placement: "bottom-start",
      });
    },
    onUpdate: (props: RenderItemsProps) => {
      component?.updateProps(props);

      if (!props.clientRect) {
        return;
      }

      popup?.[0].setProps({
        getReferenceClientRect: props.clientRect,
      });
    },
    onKeyDown: (props: RenderItemsEventProps) => {
      if (props.event.key === "Escape") {
        popup?.[0].hide();
        return true;
      }

      return (component?.ref as { onKeyDown: (props: KeyDownProps) => boolean })?.onKeyDown(props);
    },
    onExit: () => {
      popup?.[0].destroy();
      component?.destroy();
    },
  };
};

export const SlashCommand = Extension.create({
  name: "slashCommand",

  addOptions() {
    return {
      suggestion: {
        char: "/",
        command: ({ editor, range, props }: { editor: Editor; range: { from: number; to: number }; props: { command: (data: CommandProps) => void } }) => {
          props.command({ editor, range });
        },
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ];
  },
});

export const slashCommandSuggestion = {
  items: getSuggestionItems,
  render: renderItems,
};
