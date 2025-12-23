import { useEffect, useState } from "react";
import { Editor } from "@tiptap/react";

/**
 * Hook that triggers component re-renders when the editor state changes.
 * Selection updates are immediate for responsive UI, while transactions are debounced.
 */
export const useDebouncedEditorUpdate = (editor: Editor | null, delay: number = 300) => {
  const [, setUpdateCounter] = useState(0);

  useEffect(() => {
    if (!editor) return;

    const handleUpdate = () => {
      setUpdateCounter((prev) => prev + 1);
    };

    let debounceTimeout: NodeJS.Timeout;
    const handleTransactionDebounced = () => {
      clearTimeout(debounceTimeout);
      debounceTimeout = setTimeout(handleUpdate, delay);
    };

    // Immediate update on selection change for responsive UI
    editor.on("selectionUpdate", handleUpdate);
    // Debounced update on transactions to avoid excessive re-renders
    editor.on("transaction", handleTransactionDebounced);

    return () => {
      clearTimeout(debounceTimeout);
      editor.off("selectionUpdate", handleUpdate);
      editor.off("transaction", handleTransactionDebounced);
    };
  }, [editor, delay]);
};
