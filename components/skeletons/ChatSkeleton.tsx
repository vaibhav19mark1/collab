import { Skeleton } from "@/components/ui/skeleton";

export function ChatSkeleton() {
  return (
    <div className="flex flex-col space-y-4 p-4 h-full">
      {/* Received message */}
      <div className="flex gap-3 max-w-[75%]">
        <Skeleton className="h-8 w-8 rounded-full" />
        <div className="flex flex-col gap-1 w-full">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-full rounded-lg rounded-tl-sm" />
        </div>
      </div>

      {/* Sent message */}
      <div className="flex gap-3 max-w-[75%] ml-auto flex-row-reverse">
        <Skeleton className="h-8 w-8 rounded-full" />
        <div className="flex flex-col gap-1 w-full items-end">
          <Skeleton className="h-10 w-full rounded-lg rounded-tr-sm" />
        </div>
      </div>

      {/* Received message */}
      <div className="flex gap-3 max-w-[60%]">
        <Skeleton className="h-8 w-8 rounded-full" />
        <div className="flex flex-col gap-1 w-full">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-16 w-full rounded-lg rounded-tl-sm" />
        </div>
      </div>

      {/* Sent message */}
      <div className="flex gap-3 max-w-[75%] ml-auto flex-row-reverse">
        <Skeleton className="h-8 w-8 rounded-full" />
        <div className="flex flex-col gap-1 w-full items-end">
          <Skeleton className="h-8 w-3/4 rounded-lg rounded-tr-sm" />
        </div>
      </div>
    </div>
  );
}
