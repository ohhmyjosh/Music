import { useQuery } from "@tanstack/react-query";
import Shelf, { ShelfSkeleton } from "./Shelf";
import MediaCard from "./MediaCard";

// A shelf that owns its query: skeleton while loading, nothing if it fails or
// comes back empty (a dead source never leaves a broken row on the page).
export default function QueryShelf({ queryKey, queryFn, enabled = true, round, render, ...shelfProps }) {
  const { data, isLoading } = useQuery({ queryKey, queryFn, enabled });
  if (isLoading) return <ShelfSkeleton round={round} />;
  if (!data || (Array.isArray(data) && !data.length)) return null;
  return <Shelf {...shelfProps}>{render(data)}</Shelf>;
}

export function collectionCards(items) {
  return items.map((item) => <MediaCard key={`${item.kind}-${item.id}`} item={item} />);
}

export function songCards(from) {
  return (songs) =>
    songs.map((song, i) => <MediaCard key={song.id} item={song} tracks={songs} position={i} from={from} />);
}
