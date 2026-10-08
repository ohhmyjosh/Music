import { Fragment } from "react";
import { Link } from "react-router-dom";

// "Artist A, Artist B" with each name linking to its artist page, as YouTube
// Music does everywhere a song is listed. Falls back to plain text when the
// source has no artist ids (Audius, local files).
export default function ArtistLinks({ track, className = "", onNavigate }) {
  if (!track.artists?.length) return <span className={className}>{track.artist}</span>;
  return (
    <span className={className}>
      {track.artists.map((artist, index) => (
        <Fragment key={artist.id}>
          {index > 0 ? ", " : ""}
          <Link
            to={`/artist/${artist.id}`}
            className="hover:underline"
            onClick={(event) => {
              event.stopPropagation();
              onNavigate?.();
            }}
          >
            {artist.name}
          </Link>
        </Fragment>
      ))}
    </span>
  );
}
