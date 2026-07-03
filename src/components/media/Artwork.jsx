import { useEffect, useState } from "react";
import clsx from "clsx";
import { fallbackArtwork } from "../../utils/normalizeTrack";
import { fetchOfficialArtwork } from "../../api/artwork";

// Shared cover-art image. Never lets flexbox squash it (shrink-0), and swaps in
// the branded Josh-Fy placeholder when a remote artwork URL fails to load.
//
// When a track ships no real artwork but we know its artist/title, we look up
// the official album cover (iTunes) and swap it in once it resolves.
export default function Artwork({ src, alt = "", className, artist, title, ...rest }) {
  const hasRealSrc = Boolean(src) && src !== fallbackArtwork;
  const [resolved, setResolved] = useState(hasRealSrc ? src : "");

  useEffect(() => {
    let active = true;

    if (hasRealSrc) {
      setResolved(src);
      return () => {};
    }
    if (!artist && !title) {
      setResolved("");
      return () => {};
    }

    fetchOfficialArtwork(artist, title).then((art) => {
      if (active && art) setResolved(art);
    });
    return () => {
      active = false;
    };
  }, [src, artist, title, hasRealSrc]);

  return (
    <img
      src={resolved || src || fallbackArtwork}
      alt={alt}
      loading="lazy"
      onError={(event) => {
        if (event.currentTarget.src !== fallbackArtwork) {
          event.currentTarget.src = fallbackArtwork;
        }
      }}
      className={clsx("shrink-0 object-cover", className)}
      {...rest}
    />
  );
}
