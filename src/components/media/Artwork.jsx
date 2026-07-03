import clsx from "clsx";
import { fallbackArtwork } from "../../utils/normalizeTrack";

// Shared cover-art image. Never lets flexbox squash it (shrink-0), and swaps
// in the branded Josh-Fy placeholder when a remote artwork URL fails to load.
export default function Artwork({ src, alt = "", className, ...rest }) {
  return (
    <img
      src={src || fallbackArtwork}
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
