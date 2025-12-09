import { Editor } from "@tiptap/react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  editor: Editor | null;
}

interface HeadingItem {
  id: string;
  text: string;
  level: number;
  pos: number;
}

export const Sidebar = ({ editor }: SidebarProps) => {
  const [items, setItems] = useState<HeadingItem[]>([]);

  useEffect(() => {
    if (!editor) return;

    const updateTableOfContents = () => {
      const headings: HeadingItem[] = [];
      editor.state.doc.descendants((node, pos) => {
        if (node.type.name === "heading") {
          const id = `heading-${headings.length + 1}`;
          headings.push({
            id,
            text: node.textContent,
            level: node.attrs.level,
            pos,
          });
        }
      });
      setItems(headings);
    };

    updateTableOfContents();
    editor.on("update", updateTableOfContents);

    return () => {
      editor.off("update", updateTableOfContents);
    };
  }, [editor]);

  // Handle scrolling to heading
  const scrollToHeading = (pos: number) => {
    if (!editor) return;
    editor.commands.focus();
    editor.commands.setTextSelection(pos);
    editor.view.dispatch(editor.view.state.tr.scrollIntoView());
  };

  return (
    <div className="p-6 w-full">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-6">
        Table of Contents
      </h3>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">No headings yet</p>
      ) : (
        <ul className="space-y-3">
          {items.map((item, index) => (
            <li
              key={index}
              style={{ paddingLeft: `${(item.level - 1) * 12}px` }}
              className="relative group"
            >
              <button
                onClick={() => scrollToHeading(item.pos)}
                className={cn(
                  "text-sm text-left w-full hover:text-primary transition-colors truncate",
                  "text-muted-foreground"
                )}
              >
                {item.text}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
