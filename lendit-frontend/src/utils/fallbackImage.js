export const createFallbackImage = (label = 'No Image', width = 600, height = 350) => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${label}">
      <rect width="100%" height="100%" fill="#eef4f8"/>
      <rect x="${Math.round(width * 0.18)}" y="${Math.round(height * 0.2)}" width="${Math.round(width * 0.64)}" height="${Math.round(height * 0.6)}" rx="18" fill="#dce7ef"/>
      <circle cx="${Math.round(width * 0.5)}" cy="${Math.round(height * 0.45)}" r="36" fill="#b8c8d4"/>
      <path d="M ${Math.round(width * 0.33)} ${Math.round(height * 0.68)} L ${Math.round(width * 0.43)} ${Math.round(height * 0.54)} L ${Math.round(width * 0.5)} ${Math.round(height * 0.62)} L ${Math.round(width * 0.59)} ${Math.round(height * 0.48)} L ${Math.round(width * 0.68)} ${Math.round(height * 0.68)} Z" fill="#b8c8d4"/>
      <text x="50%" y="${Math.round(height * 0.84)}" text-anchor="middle" font-family="Arial, sans-serif" font-size="22" fill="#6a7b88">${label}</text>
    </svg>
  `.trim();

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};