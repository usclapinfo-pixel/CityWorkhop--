const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() ?? '';

export const env = {
  apiBaseUrl: apiBaseUrl.replace(/\/$/, ''),
};
