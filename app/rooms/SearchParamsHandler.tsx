"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect } from "react";

interface SearchParamsHandlerProps {
  onOpenModal: (tab: "create" | "join") => void;
}

export const SearchParamsHandler = ({ onOpenModal }: SearchParamsHandlerProps) => {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const action = searchParams.get("action");
    if (action === "create" || action === "join") {
      onOpenModal(action);
      // Clear the param
      router.replace("/rooms", { scroll: false });
    }
  }, [searchParams, router, onOpenModal]);

  return null;
};
