import { createCover } from "./demoArt";

export const demoAlbums = [
  {
    id: "album-pop-essentials",
    title: "Pop Essentials",
    artist: "Josh-Fy Demo",
    genre: "Pop",
    mood: "Bright",
    image: createCover("Pop Essentials", ["#22c55e", "#1f2937", "#ec4899"]),
    year: 2025,
    trackCount: 14,
    description: "Big hooks, bright synths, and easy replay energy.",
    tags: ["pop", "selena gomez-style", "dua lipa-style", "taylor-style"]
  },
  {
    id: "album-rap-rotation",
    title: "Rap Rotation",
    artist: "Josh-Fy Demo",
    genre: "Rap",
    mood: "Hype",
    image: createCover("Rap Rotation", ["#16a34a", "#0f172a", "#7c2d12"]),
    year: 2025,
    trackCount: 12,
    description: "High-energy bars, punchy drums, and workout-ready flow.",
    tags: ["rap", "eminem-style", "busta rhymes-style", "drake-style"]
  },
  {
    id: "album-rnb-nights",
    title: "R&B Nights",
    artist: "Josh-Fy Demo",
    genre: "R&B",
    mood: "Night Drive",
    image: createCover("R&B Nights", ["#22c55e", "#111827", "#7c3aed"]),
    year: 2024,
    trackCount: 11,
    description: "Smooth hooks, velvet melodies, and midnight replay vibes.",
    tags: ["r&b", "chris brown-style", "usher-style", "sza-style"]
  },
  {
    id: "album-lofi-study-box",
    title: "Lo-fi Study Box",
    artist: "Josh-Fy Demo",
    genre: "Lo-fi",
    mood: "Focus",
    image: createCover("Lo-fi Study Box", ["#14b8a6", "#0f172a", "#334155"]),
    year: 2025,
    trackCount: 18,
    description: "Rain loops, gentle keys, and chillhop focus loops.",
    tags: ["lofi", "study beats", "rainy lofi", "focus"]
  },
  {
    id: "album-hindi-chill",
    title: "Hindi Chill",
    artist: "Josh-Fy Demo",
    genre: "Hindi",
    mood: "Relax",
    image: createCover("Hindi Chill", ["#22c55e", "#172554", "#f97316"]),
    year: 2024,
    trackCount: 10,
    description: "Soft indie Hindi textures and monsoon-friendly moods.",
    tags: ["hindi", "indie hindi", "hindi lofi", "romantic"]
  },
  {
    id: "album-gym-heat",
    title: "Gym Heat",
    artist: "Josh-Fy Demo",
    genre: "Workout",
    mood: "Gym",
    image: createCover("Gym Heat", ["#16a34a", "#111827", "#dc2626"]),
    year: 2025,
    trackCount: 13,
    description: "Trap, phonk, and rap energy for heavy sessions.",
    tags: ["workout", "trap energy", "phonk", "high bpm"]
  }
];
