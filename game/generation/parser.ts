import { FloorData } from '../types';

export function parseFloorJson(json: string): FloorData | null {
  try {
    const data = JSON.parse(json);
    if (!data.map || !Array.isArray(data.map)) return null;
    if (data.map.length !== 25) return null;
    if (data.map.some((row: unknown) => !Array.isArray(row) || (row as unknown[]).length !== 40)) return null;
    return data as FloorData;
  } catch {
    return null;
  }
}

export function parseFloorResponse(response: unknown): FloorData | null {
  if (!response || typeof response !== 'object') return null;
  const data = response as Record<string, unknown>;
  if (!Array.isArray(data.map)) return null;
  return data as unknown as FloorData;
}
