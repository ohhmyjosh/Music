import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { getSongById } from "../api/saavn";
import { usePlayerStore } from "../store/playerStore";
import { useUiStore } from "../store/uiStore";

// Shared song links (/watch?v=<id>, the ⋮ → Share link) land here: load the
// song, start a radio from it and open Now Playing.
export default function Watch() {
  const [params] = useSearchParams();
  const id = params.get("v");
  const [failed, setFailed] = useState(!id);

  useEffect(() => {
    if (!id) return undefined;
    let cancelled = false;
    getSongById(id)
      .then((song) => {
        if (cancelled) return;
        if (!song?.audioUrl) {
          setFailed(true);
          return;
        }
        usePlayerStore.getState().startRadio(song);
        useUiStore.getState().openNowPlaying("upnext");
      })
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <div className="page flex flex-col items-center py-24 text-center">
      {failed ? (
        <>
          <p className="text-lg font-medium">This song couldn't be found.</p>
          <Link to="/" className="pill-primary mt-6">
            Go home
          </Link>
        </>
      ) : (
        <>
          <Loader2 size={32} className="animate-spin text-yt-muted" />
          <p className="mt-4 text-yt-muted">Loading song…</p>
        </>
      )}
    </div>
  );
}
