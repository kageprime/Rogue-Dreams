import { FloorTheme } from '../types';

const themes: FloorTheme[] = [
  { name: 'Dungeon', floor: 1, bg: 0x1a1a2e, wall: 0x444466, wallLine: 0x555577, floor_: 0x2a2a4a, floorLine: 0x333355, door: 0x664422, exit: 0x44ff44 },
  { name: 'Cave', floor: 3, bg: 0x1a1a1a, wall: 0x555544, wallLine: 0x666655, floor_: 0x333322, floorLine: 0x444433, door: 0x553322, exit: 0x44ff44 },
  { name: 'Ice', floor: 5, bg: 0x0a1a2e, wall: 0x4488aa, wallLine: 0x5599bb, floor_: 0x224466, floorLine: 0x335577, door: 0x336688, exit: 0x88ffff },
  { name: 'Fire', floor: 7, bg: 0x1e0a0a, wall: 0x883333, wallLine: 0x994444, floor_: 0x552222, floorLine: 0x663333, door: 0x884422, exit: 0xff8844 },
  { name: 'Void', floor: 9, bg: 0x0a0a1e, wall: 0x333355, wallLine: 0x444466, floor_: 0x111133, floorLine: 0x222244, door: 0x442266, exit: 0xaa44ff },
];

export function getTheme(floorNumber: number): FloorTheme {
  let best = themes[0];
  for (const t of themes) {
    if (floorNumber >= t.floor) best = t;
  }
  return best;
}

export function getExitColor(floorNumber: number): number {
  return getTheme(floorNumber).exit;
}
