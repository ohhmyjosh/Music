import { demoTracks } from "./demoTracks";
import { createCover } from "./demoArt";

function pickTracks(ids) {
  return demoTracks.filter((track) => ids.includes(track.id));
}

export const demoPlaylists = [
  {
    id: "playlist-josh-rap-mix",
    title: "Josh's Rap Mix",
    subtitle: "Rap rotation, sharp hooks, and high-energy picks",
    genre: "Rap",
    mood: "Hype",
    image: createCover("Josh's Rap Mix", ["#16a34a", "#0f172a", "#7c2d12"]),
    tracks: pickTracks(["track-2", "track-7", "track-13", "track-18"]),
    description: "Built around rap workout energy and replayable hooks.",
    tags: ["rap", "eminem-style", "busta rhymes-style", "drake-style"]
  },
  {
    id: "playlist-late-night-rnb",
    title: "Late Night R&B",
    subtitle: "Smooth modern R&B for after-dark listening",
    genre: "R&B",
    mood: "Night Drive",
    image: createCover("Late Night R&B", ["#22c55e", "#111827", "#7c3aed"]),
    tracks: pickTracks(["track-1", "track-6", "track-8"]),
    description: "Soft melodies and low-lit replay energy.",
    tags: ["r&b", "chris brown-style", "usher-style", "sza-style"]
  },
  {
    id: "playlist-focus-lofi",
    title: "Focus Lo-fi",
    subtitle: "Rain loops, study beats, and chillhop texture",
    genre: "Lo-fi",
    mood: "Focus",
    image: createCover("Focus Lo-fi", ["#14b8a6", "#0f172a", "#334155"]),
    tracks: pickTracks(["track-4", "track-16", "track-12"]),
    description: "A calm study shelf with late-night lo-fi flavor.",
    tags: ["lofi", "study beats", "rainy lofi", "focus"]
  },
  {
    id: "playlist-pop-drive",
    title: "Pop Drive",
    subtitle: "Mainstream-style pop built for repeat plays",
    genre: "Pop",
    mood: "Upbeat",
    image: createCover("Pop Drive", ["#22c55e", "#1f2937", "#ec4899"]),
    tracks: pickTracks(["track-3", "track-5", "track-9", "track-17"]),
    description: "Clean hooks and bright chorus moments.",
    tags: ["pop", "selena gomez-style", "dua lipa-style", "ed sheeran-style"]
  },
  {
    id: "playlist-hindi-mood",
    title: "Hindi Mood",
    subtitle: "Hindi chill, romantic color, and Punjabi energy",
    genre: "Hindi",
    mood: "Mixed",
    image: createCover("Hindi Mood", ["#22c55e", "#172554", "#f97316"]),
    tracks: pickTracks(["track-11", "track-12"]),
    description: "A blend of Bollywood-inspired and indie Hindi moods.",
    tags: ["hindi", "punjabi party", "hindi lofi", "indie hindi"]
  },
  {
    id: "radio-busta-style",
    title: "Busta Rhymes-style Rap Energy",
    subtitle: "Artist-inspired radio station",
    genre: "Rap",
    mood: "Hype",
    image: createCover("Busta-style Radio", ["#16a34a", "#0f172a", "#92400e"]),
    tracks: pickTracks(["track-2", "track-7", "track-18"]),
    description: "Demo station inspired by fast, punchy rap energy.",
    tags: ["busta", "busta rhymes-style", "rap", "radio"]
  },
  {
    id: "radio-chris-style",
    title: "Chris Brown-style R&B",
    subtitle: "Artist-inspired radio station",
    genre: "R&B",
    mood: "Night Drive",
    image: createCover("Chris-style R&B", ["#22c55e", "#111827", "#a21caf"]),
    tracks: pickTracks(["track-1", "track-6", "track-8"]),
    description: "Demo station inspired by smooth, melodic R&B replay value.",
    tags: ["chris brown", "chris brown-style", "r&b", "radio"]
  },
  {
    id: "radio-eminem-style",
    title: "Eminem-style Rap Energy",
    subtitle: "Artist-inspired radio station",
    genre: "Workout",
    mood: "Workout",
    image: createCover("Eminem-style Mix", ["#16a34a", "#111827", "#dc2626"]),
    tracks: pickTracks(["track-2", "track-13", "track-14"]),
    description: "Demo station inspired by intense rap workout pacing.",
    tags: ["eminem", "eminem-style", "workout", "radio"]
  },
  {
    id: "radio-ed-style",
    title: "Ed Sheeran-style Acoustic Pop",
    subtitle: "Artist-inspired radio station",
    genre: "Chill",
    mood: "Relax",
    image: createCover("Ed-style Acoustic", ["#22c55e", "#1f2937", "#0ea5e9"]),
    tracks: pickTracks(["track-5", "track-15"]),
    description: "Demo station inspired by acoustic pop and soft hooks.",
    tags: ["ed sheeran", "ed sheeran-style", "acoustic pop", "radio"]
  },
  {
    id: "radio-selena-style",
    title: "Selena Gomez-style Pop Glow",
    subtitle: "Artist-inspired radio station",
    genre: "Pop",
    mood: "Bright",
    image: createCover("Selena-style Pop", ["#22c55e", "#1f2937", "#f43f5e"]),
    tracks: pickTracks(["track-3", "track-9", "track-17"]),
    description: "Demo station inspired by sleek pop and glossy choruses.",
    tags: ["selena", "selena gomez-style", "pop", "radio"]
  },
  {
    id: "radio-lofi-rain",
    title: "Lo-fi Rain Station",
    subtitle: "Artist-inspired radio station",
    genre: "Lo-fi",
    mood: "Focus",
    image: createCover("Lo-fi Rain", ["#14b8a6", "#0f172a", "#1d4ed8"]),
    tracks: pickTracks(["track-4", "track-16", "track-12"]),
    description: "Rainy lo-fi loops and gentle focus textures.",
    tags: ["lofi", "rain", "study beats", "radio"]
  }
];
