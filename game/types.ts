export interface FloorData {
  map: number[][];
  rooms: Room[];
  enemies: EnemyData[];
  weapon: WeaponData;
  items: GameItemData[];
  boss: EnemyData | null;
}

export interface Room {
  x: number;
  y: number;
  w: number;
  h: number;
  doors: { dir: 'n' | 's' | 'e' | 'w'; x: number; y: number }[];
}

export interface EnemyData {
  id: string;
  type: 'melee' | 'ranged';
  name: string;
  hp: number;
  speed: number;
  damage: number;
  spriteRecipe: SpriteRecipe;
  isElite?: boolean;
}

export interface WeaponData {
  name: string;
  damage: number;
  fireRate: number;
  projectileSpeed: number;
  description: string;
}

export interface GameItemData {
  type: 'health' | 'weapon' | 'passive';
  x: number;
  y: number;
  value: number;
  name?: string;
  passiveType?: PassiveItemType;
  weaponData?: WeaponData;
}

export type PassiveItemType = 'speed' | 'shield' | 'trishot';

export interface SpriteRecipe {
  body: string;
  color: string;
  eyes: string;
  size: number;
}

export interface FloorTheme {
  name: string;
  floor: number;
  bg: number;
  wall: number;
  wallLine: number;
  floor_: number;
  floorLine: number;
  door: number;
  exit: number;
}

export type TileType = 0 | 1 | 2 | 3;

export const TILE_WALL = 1;
export const TILE_FLOOR = 0;
export const TILE_DOOR = 2;
export const TILE_EXIT = 3;

export const TILE_SIZE = 32;
