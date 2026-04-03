const normalizeBaseUrl = (url) => {
  if (!url) return 'http://localhost:8080';
  return url.replace(/\/+$/, '');
};

export const backendBaseUrl = normalizeBaseUrl(import.meta.env.VITE_API_URL);

export const buildToolImageUrl = (toolId) => {
  if (!toolId) return null;
  return `${backendBaseUrl}/api/tools/${toolId}/image`;
};
