// Simple in-memory cache to preserve page data across React Router tab unmounts.
const memoryCache: Record<string, any> = {};

export const getCachedData = <T>(key: string, defaultValue: T): T => {
  return key in memoryCache ? (memoryCache[key] as T) : defaultValue;
};

export const setCachedData = (key: string, data: any): void => {
  memoryCache[key] = data;
};

export const clearCache = (key?: string): void => {
  if (key) {
    delete memoryCache[key];
  } else {
    Object.keys(memoryCache).forEach((k) => delete memoryCache[k]);
  }
};
