import { RoomCardSkeleton } from "./RoomCardSkeleton";

export function RoomListSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <RoomCardSkeleton key={i} />
      ))}
    </div>
  );
}
