import { NextRequest, NextResponse } from 'next/server';
import { buildFloorPrompt } from '@/game/generation/prompt';

export async function POST(req: NextRequest) {
  const { floorNumber } = await req.json();
  const floor = floorNumber || 1;

  const prompt = buildFloorPrompt(floor);

  try {
    const response = await fetch(process.env.LLM_API_URL || '', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.LLM_API_KEY || ''}`,
      },
      body: JSON.stringify({
        model: process.env.LLM_MODEL || 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      return NextResponse.json(generateFloor(floor));
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (content) {
      try {
        const parsed = JSON.parse(content);
        return NextResponse.json(parsed);
      } catch {
        return NextResponse.json(generateFloor(floor));
      }
    }

    return NextResponse.json(generateFloor(floor));
  } catch {
    return NextResponse.json(generateFloor(floor));
  }
}

const MELEE_TYPES = [
  { id: 'slime', name: 'Slime', baseHp: 3, baseSpeed: 60, baseDamage: 1, recipe: { body: 'blob' as const, color: '#44aa44', eyes: 'dots' as const, size: 24 } },
  { id: 'bat', name: 'Bat', baseHp: 2, baseSpeed: 90, baseDamage: 1, recipe: { body: 'triangle' as const, color: '#8844aa', eyes: 'dots' as const, size: 20 } },
  { id: 'imp', name: 'Imp', baseHp: 4, baseSpeed: 70, baseDamage: 2, recipe: { body: 'square' as const, color: '#cc4444', eyes: 'big' as const, size: 28 } },
  { id: 'golem', name: 'Golem', baseHp: 6, baseSpeed: 40, baseDamage: 2, recipe: { body: 'diamond' as const, color: '#886644', eyes: 'slits' as const, size: 32 } },
];

const RANGED_TYPES = [
  { id: 'archer', name: 'Archer', baseHp: 2, baseSpeed: 70, baseDamage: 1, recipe: { body: 'cross' as const, color: '#44aaff', eyes: 'dots' as const, size: 24 } },
  { id: 'mage', name: 'Mage', baseHp: 2, baseSpeed: 60, baseDamage: 2, recipe: { body: 'star' as const, color: '#aa44ff', eyes: 'glow' as const, size: 26 } },
];

const BOSS_NAMES = ['Gorlak', 'Malgrim', 'Vexar', 'Thul', 'Zorn', 'Krag'];
const BOSS_TITLES = ['the Unyielding', 'of the Deep', 'the Corrupted', 'the Ancient', 'the Void-Touched'];

const WEAPONS = [
  { name: 'Pea Shooter', damage: 1, fireRate: 4, projectileSpeed: 400, description: 'A classic.' },
  { name: 'Blaster', damage: 2, fireRate: 3, projectileSpeed: 500, description: 'Steady and reliable.' },
  { name: 'Shotstring', damage: 1, fireRate: 6, projectileSpeed: 350, description: 'Rapid fire, low punch.' },
  { name: 'Slugger', damage: 3, fireRate: 1.5, projectileSpeed: 600, description: 'Slow but hits hard.' },
  { name: 'Spread', damage: 1, fireRate: 3, projectileSpeed: 400, description: 'Wide spread.' },
];

function generateFloor(floorNumber: number) {
  const rows = 25;
  const cols = 40;
  const map: number[][] = [];
  const isBossFloor = floorNumber % 3 === 0;

  for (let r = 0; r < rows; r++) {
    map[r] = [];
    for (let c = 0; c < cols; c++) {
      map[r][c] = (r === 0 || r === rows - 1 || c === 0 || c === cols - 1) ? 1 : 0;
    }
  }

  const rooms = [
    { x: 2, y: 2, w: 8, h: 6 },
    { x: 14, y: 2, w: 10, h: 6 },
    { x: 28, y: 2, w: 8, h: 8 },
    { x: 2, y: 12, w: 10, h: 8 },
    { x: 16, y: 14, w: 10, h: 8 },
    { x: 28, y: 14, w: 8, h: 8 },
  ];

  const bossRoomIdx = rooms.length - 1;
  for (let i = 0; i < rooms.length; i++) {
    const room = rooms[i];
    const isBoss = isBossFloor && i === bossRoomIdx;
    const mult = isBoss ? 2 : 1;
    const rw = room.w * mult;
    const rh = room.h * mult;
    for (let r = room.y; r < room.y + rh; r++) {
      for (let c = room.x; c < room.x + rw; c++) {
        if (r === room.y || r === room.y + rh - 1 || c === room.x || c === room.x + rw - 1) {
          map[r][c] = 1;
        } else {
          map[r][c] = 0;
        }
      }
    }
    map[room.y + Math.floor(rh / 2)][room.x] = 2;
    map[room.y + Math.floor(rh / 2)][room.x + rw - 1] = 2;
  }

  if (!isBossFloor) {
    const lastRoom = rooms[rooms.length - 1];
    map[lastRoom.y + Math.floor(lastRoom.h / 2)][lastRoom.x + lastRoom.w - 2] = 3;
  }

  const enemyCount = Math.min(2 + Math.floor(floorNumber / 2), 8);
  const enemies = [];

  for (let i = 0; i < enemyCount; i++) {
    const useRanged = floorNumber > 2 && i % 3 === 0;
    const pool = useRanged ? RANGED_TYPES : MELEE_TYPES;
    const t = pool[i % pool.length];
    const isElite = Math.random() < 0.1;
    enemies.push({
      id: `${t.id}_${i}`,
      type: useRanged ? 'ranged' : 'melee',
      name: t.name,
      hp: t.baseHp + floorNumber + (isElite ? 3 : 0),
      speed: t.baseSpeed + Math.min(floorNumber * 2, 20),
      damage: t.baseDamage + Math.floor(floorNumber / 4),
      spriteRecipe: { ...t.recipe, size: t.recipe.size },
      isElite,
    });
  }

  const selectedWeapon = WEAPONS[floorNumber % WEAPONS.length];

  const items: Array<{ type: string; x: number; y: number; value: number; name?: string; weaponData?: unknown; passiveType?: string }> = [];

  if (floorNumber > 1) {
    const wpn = WEAPONS[(floorNumber + 1) % WEAPONS.length];
    items.push({
      type: 'weapon', x: 0, y: 0, value: 0, name: wpn.name, weaponData: wpn,
    });
  }

  const PASSIVES: ('speed' | 'shield' | 'trishot')[] = ['speed', 'shield', 'trishot'];
  if (floorNumber > 3) {
    items.push({
      type: 'passive', x: 0, y: 0, value: 0, name: 'Item',
      passiveType: PASSIVES[(floorNumber - 4) % PASSIVES.length],
    });
  }

  items.push({ type: 'health', x: 0, y: 0, value: 2, name: 'Health' });

  let bossData = null;
  if (isBossFloor) {
    const bossName = BOSS_NAMES[floorNumber % BOSS_NAMES.length];
    const bossTitle = BOSS_TITLES[floorNumber % BOSS_TITLES.length];
    bossData = {
      id: 'boss',
      type: 'melee',
      name: `${bossName} ${bossTitle}`,
      hp: 5 + floorNumber * 2,
      speed: 80 + floorNumber * 3,
      damage: 2 + Math.floor(floorNumber / 3),
      spriteRecipe: { body: 'square', color: '#ff4444', eyes: 'big', size: 48 },
    };
  }

  return { map, rooms, enemies, weapon: selectedWeapon, items, boss: bossData };
}
