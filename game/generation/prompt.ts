export function buildFloorPrompt(floorNumber: number): string {
  return `Generate a roguelike dungeon floor for a retro game.

Floor number: ${floorNumber}

Return JSON with this exact structure:
{
  "map": a 2D array (25 rows x 40 cols) of integers: 0=floor, 1=wall, 2=door, 3=exit,
  "rooms": array of { x, y, w, h, doors: [{ dir: "n"|"s"|"e"|"w", x, y }] },
  "enemies": array of 2 enemy objects with { id, type: "melee"|"ranged", name, hp, speed, damage, spriteRecipe: { body, color, eyes, size } },
  "weapon": one weapon object with { name, damage, fireRate, projectileSpeed, description },
  "items": array of { type: "health", x, y, value },
  "boss": null or an enemy object
}

Requirements:
- Map must be 25 rows x 40 cols
- Create 5-8 rectangular rooms connected by corridors
- Place exit tile in the last room
- Enemies should be spread across rooms
- Weapon name should be a pun or retro reference
- Keep stats balanced for floor ${floorNumber}`;
}

export function validateFloorJson(raw: unknown): boolean {
  if (!raw || typeof raw !== 'object') return false;
  const data = raw as Record<string, unknown>;
  if (!Array.isArray(data.map)) return false;
  if (!Array.isArray(data.enemies)) return false;
  if (!data.weapon || typeof data.weapon !== 'object') return false;
  return true;
}
