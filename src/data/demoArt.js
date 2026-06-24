export function createCover(label, palette = ["#1db954", "#0f172a", "#111827"]) {
  const [primary, secondary, accent] = palette;
  const initials = label
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${primary}" />
          <stop offset="55%" stop-color="${secondary}" />
          <stop offset="100%" stop-color="${accent}" />
        </linearGradient>
      </defs>
      <rect width="600" height="600" rx="48" fill="url(#g)" />
      <circle cx="480" cy="130" r="90" fill="rgba(255,255,255,0.08)" />
      <circle cx="120" cy="520" r="150" fill="rgba(255,255,255,0.06)" />
      <path d="M90 380C170 310 260 320 335 245C385 195 430 125 520 120" stroke="rgba(255,255,255,0.14)" stroke-width="24" fill="none" stroke-linecap="round" />
      <text x="60" y="120" fill="white" font-family="Arial, sans-serif" font-size="42" font-weight="700">Josh-Fy</text>
      <text x="60" y="480" fill="white" font-family="Arial, sans-serif" font-size="144" font-weight="700">${initials}</text>
      <text x="60" y="540" fill="rgba(255,255,255,0.8)" font-family="Arial, sans-serif" font-size="34">${label}</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}
