"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useYjs } from "@/contexts/YjsContext";
import { Whiteboard } from "./Whiteboard";
import { WhiteboardHeader } from "./WhiteboardHeader";
import { Participant } from "@/types/room.types";
import * as Y from "yjs";
import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import type { ExcalidrawImperativeAPI, AppState, BinaryFiles } from "@excalidraw/excalidraw/types";

interface CollaborativeWhiteboardProps {
  documentTitle?: string;
  roomId?: string;
  participants?: Participant[];
  editable?: boolean;
}

export const CollaborativeWhiteboard = ({
  documentTitle = "Untitled",
  roomId = "",
  participants = [],
  editable = true,
}: CollaborativeWhiteboardProps) => {
  const { provider, doc, isConnected } = useYjs();
  const [excalidrawAPI, setExcalidrawAPI] = useState<ExcalidrawImperativeAPI | null>(null);
  const [isSynced, setIsSynced] = useState(false);

  // Refs to track state and prevent loops
  const elementsRef = useRef<Map<string, ExcalidrawElement>>(new Map());
  const isRemoteUpdate = useRef(false);

  // Initialize and Sync Logic
  useEffect(() => {
    if (!doc || !excalidrawAPI || isSynced) return;

    const yElements = doc.getArray<ExcalidrawElement>("excalidraw-elements");

    // Initial Load
    if (yElements.length > 0) {
      const initialElements = yElements.toArray();
      // Store in ref for diffing
      initialElements.forEach((el) => elementsRef.current.set(el.id, el));

      isRemoteUpdate.current = true;
      excalidrawAPI.updateScene({ elements: initialElements });
      isRemoteUpdate.current = false;
    }

    setIsSynced(true);

    // Observer for remote changes
    const observer = (event: Y.YArrayEvent<ExcalidrawElement>) => {
      if (event.transaction.local) return;

      const currentElements = yElements.toArray();

      // Update ref
      currentElements.forEach((el) => elementsRef.current.set(el.id, el));

      isRemoteUpdate.current = true;
      excalidrawAPI.updateScene({ elements: currentElements });
      isRemoteUpdate.current = false;
    };

    yElements.observe(observer);

    return () => {
      yElements.unobserve(observer);
    };
  }, [doc, excalidrawAPI, isSynced]);

  // Handle local changes
  const onChange = useCallback(
    (elements: readonly ExcalidrawElement[], _appState: AppState, _files: BinaryFiles) => {
      if (!doc || !editable || isRemoteUpdate.current) return;

      const yElements = doc.getArray<ExcalidrawElement>("excalidraw-elements");

      doc.transact(() => {
        // Simple strategy:
        // 1. Detect changed elements by checking version/existence in ref
        // 2. Update Yjs array.
        //
        // Note: Ideally we should do granular updates to the specific index of the modified element.
        // For simplicity and initial robustness, we will try to match by ID.
        // However, Y.Array operations are index-based.

        // Optimization: If simple length mismatch or just one element changed
        // For now, let's just syncing the whole array if there are changes to ensure consistency
        // but this is heavy.

        // A better approach for MVP:
        // Excalidraw elements are immutable. We can check reference equality if we maintained state,
        // but here we get new objects. We check `version`.

        let hasChanges = false;

        // We need to reflect the order and content of 'elements' into 'yElements'
        // Doing a full replace is safest for order but expensive.
        // yElements.delete(0, yElements.length);
        // yElements.push(elements as ExcalidrawElement[]);

        // Let's try to be a bit smarter.
        // If lengths differ, full sync (add/delete happened).
        // Let's try to be a bit smarter.
        // If lengths differ, full sync (add/delete happened).
        if (yElements.length !== elements.length) {
          yElements.delete(0, yElements.length);
          yElements.push([...elements]);
          return;
        }

        // If lengths same, check for updates
        elements.forEach((el, index) => {
          const currentYEl = yElements.get(index);
          if (
            !currentYEl ||
            currentYEl.id !== el.id ||
            currentYEl.version !== el.version
          ) {
            // Replace at index
            // Note: yElements.delete(index, 1); yElements.insert(index, [el]);
            // But this shifts array? No `delete` deletes.
            // Insert deletes? No.
            // We must delete then insert.
            // But efficient way in Yjs for simple replacement?
            // Just doing it is fine.

            // If ID matches but version different, it's an update.
            // If ID doesn't match, the order changed (z-index change), so we might as well full sync or handle moves.
            // Handling moves is complex.

            if (currentYEl?.id !== el.id) {
              // Order mismatch, fallback to full re-sync of this segment or all
              // For MVP, if we detect structural change, just full sync might be safer.
              // Let's rely on the outer check or just do full sync for now to guarantee correctness.
              hasChanges = true;
            } else if (currentYEl.version !== el.version) {
              // Update specific element
              yElements.delete(index, 1);
              yElements.insert(index, [el]);
            }
          }
        });

        if (hasChanges) {
          yElements.delete(0, yElements.length);
          yElements.push([...elements]);
        }
      });
    },
    [doc, editable]
  );

  return (
    <div className="flex flex-col h-full bg-background relative">
      <WhiteboardHeader
        provider={provider}
        isConnected={isConnected}
        documentTitle={documentTitle}
        roomId={roomId}
        participants={participants}
      />
      <div className="flex-1 overflow-hidden relative">
        <Whiteboard
          excalidrawAPI={(api: ExcalidrawImperativeAPI) => setExcalidrawAPI(api)}
          onChange={onChange}
          viewModeEnabled={false}
          UIOptions={{
            canvasActions: {
              changeViewBackgroundColor: true,
              clearCanvas: true,
              export: {
                saveFileToDisk: true,
              },
              loadScene: true,
              saveToActiveFile: false,
              saveAsImage: true,
              toggleTheme: true,
            },
          }}
        />
      </div>
    </div>
  );
};
