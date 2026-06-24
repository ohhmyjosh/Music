import { createCover } from "./demoArt";

export const demoGenres = [
  {
    id: "genre-pop",
    label: "Pop",
    description: "Radio-ready hooks and polished melodies.",
    image: createCover("Pop", ["#22c55e", "#1f2937", "#ec4899"]),
    tags: ["pop", "dua lipa-style", "selena gomez-style", "taylor-style"]
  },
  {
    id: "genre-rap",
    label: "Rap",
    description: "Bars, punch, and heavy replay tracks.",
    image: createCover("Rap", ["#16a34a", "#0f172a", "#92400e"]),
    tags: ["rap", "eminem-style", "busta rhymes-style", "drake-style"]
  },
  {
    id: "genre-rnb",
    label: "R&B",
    description: "Smooth late-night vocals and modern grooves.",
    image: createCover("R&B", ["#22c55e", "#111827", "#7c3aed"]),
    tags: ["r&b", "chris brown-style", "usher-style", "sza-style"]
  },
  {
    id: "genre-lofi",
    label: "Lo-fi",
    description: "Study loops, rainy textures, and chillhop.",
    image: createCover("Lo-fi", ["#14b8a6", "#0f172a", "#334155"]),
    tags: ["lofi", "study beats", "rainy lofi", "focus"]
  },
  {
    id: "genre-hindi",
    label: "Hindi",
    description: "Bollywood romantic, indie Hindi, and chill cuts.",
    image: createCover("Hindi", ["#22c55e", "#172554", "#f97316"]),
    tags: ["hindi", "punjabi party", "hindi lofi", "indie hindi"]
  },
  {
    id: "genre-workout",
    label: "Workout",
    description: "Trap, phonk, and rap workout energy.",
    image: createCover("Workout", ["#16a34a", "#111827", "#dc2626"]),
    tags: ["workout", "gym", "trap", "high bpm"]
  },
  {
    id: "genre-chill",
    label: "Chill",
    description: "Acoustic pop, soft R&B, and night drive.",
    image: createCover("Chill", ["#22c55e", "#1f2937", "#0ea5e9"]),
    tags: ["chill", "acoustic pop", "soft r&b", "night drive"]
  },
  {
    id: "genre-throwback",
    label: "Throwback",
    description: "2000s pop, old-school rap, and 2010s hits mood.",
    image: createCover("Throwback", ["#4ade80", "#1e293b", "#1d4ed8"]),
    tags: ["throwback", "2000s pop", "old-school rap", "2010s hits"]
  }
];
