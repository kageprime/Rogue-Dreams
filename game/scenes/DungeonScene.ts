import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { Boss } from '../entities/Boss';
import { Projectile } from '../entities/Projectile';
import { CollisionSystem } from '../systems/Collision';
import { CombatSystem } from '../systems/Combat';
import { CameraSystem } from '../systems/Camera';
import { ItemSystem } from '../systems/ItemSystem';
import { Minimap } from '../systems/Minimap';
import { audio } from '../systems/Audio';
import { FloorData, TILE_SIZE, TILE_FLOOR, TILE_WALL, TILE_DOOR, TILE_EXIT, GameItemData } from '../types';
import { parseFloorResponse } from '../generation/parser';
import { getTheme, getExitColor } from '../generation/themes';

export class DungeonScene extends Phaser.Scene {
  public player!: Player;
  public enemies: Enemy[] = [];
  public boss: Boss | null = null;
  public gold: number = 0;
  public kills: number = 0;
  private collision!: CollisionSystem;
  private combat!: CombatSystem;
  private cameraSystem!: CameraSystem;
  private itemSystem!: ItemSystem;
  private minimap!: Minimap;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<string, Phaser.Input.Keyboard.Key>;
  private floorNumber: number = 1;
  private mapData: number[][] = [];
  private mapWidth: number = 0;
  private mapHeight: number = 0;
  private floorBg!: Phaser.GameObjects.Graphics;
  private exitSprite!: Phaser.GameObjects.Rectangle;
  private loadingText!: Phaser.GameObjects.Text;
  private transitioning: boolean = false;
  private bossRoom: boolean = false;
  private escKey!: Phaser.Input.Keyboard.Key;

  constructor() {
    super({ key: 'DungeonScene' });
  }

  init(data: { floorNumber?: number; gold?: number }): void {
    if (data.floorNumber !== undefined) this.floorNumber = data.floorNumber;
    if (data.gold !== undefined) this.gold = data.gold;
    this.kills = 0;
  }

  create(): void {
    this.enemies = [];
    this.boss = null;
    this.combat?.destroy();
    this.collision?.destroy();
    this.itemSystem?.destroy();
    this.minimap?.destroy();
    this.transitioning = false;
    this.bossRoom = false;

    this.collision = new CollisionSystem(this);
    this.combat = new CombatSystem(this);
    this.combat.onGoldDrop = (amount: number) => {
      this.gold += amount;
      this.registry.set('gold', this.gold);
      audio.playCoin();
      this.showGoldFloat(amount);
    };
    this.itemSystem = new ItemSystem(this);

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = {
      w: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      a: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      s: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      d: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
    this.escKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

    this.cameras.main.fadeIn(300);

    this.loadingText = this.add.text(400, 300, `Generating Floor ${this.floorNumber}...`, {
      fontSize: '24px',
      color: '#ffffff',
    });
    this.loadingText.setOrigin(0.5);

    this.applyShopItems();
    this.generateFloor();
  }

  private showGoldFloat(amount: number): void {
    const px = this.player?.sprite?.x ?? 400;
    const py = this.player?.sprite?.y ?? 300;
    const floatText = this.add.text(px, py - 20, `+${amount} gold`, {
      fontSize: '12px',
      color: '#ffcc44',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    });
    floatText.setOrigin(0.5);
    floatText.setDepth(50);
    this.tweens.add({
      targets: floatText,
      y: floatText.y - 30,
      alpha: 0,
      duration: 700,
      ease: 'Power1',
      onComplete: () => floatText.destroy(),
    });
  }

  private shopWeapon: import('../types').WeaponData | null = null;
  private shopPassive: import('../types').PassiveItemType | null = null;

  private applyShopItems(): void {
    if (this.registry.get('shopHeal')) {
      this.registry.remove('shopHeal');
    }
    const wpn = this.registry.get('shopWeapon');
    if (wpn) {
      this.shopWeapon = wpn;
      this.registry.remove('shopWeapon');
    }
    const pass = this.registry.get('shopPassive');
    if (pass) {
      this.shopPassive = pass;
      this.registry.remove('shopPassive');
    }
  }

  private async generateFloor(): Promise<void> {
    try {
      const res = await fetch('/api/generate/floor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ floorNumber: this.floorNumber }),
      });
      const data = await res.json();
      const floor = parseFloorResponse(data);
      if (floor) {
        this.buildFloor(floor);
      } else {
        this.buildFallbackFloor();
      }
    } catch {
      this.buildFallbackFloor();
    }
  }

  private buildFloor(floor: FloorData): void {
    this.loadingText.setVisible(false);
    this.mapData = floor.map;
    this.mapWidth = floor.map[0].length * TILE_SIZE;
    this.mapHeight = floor.map.length * TILE_SIZE;
    this.bossRoom = floor.boss !== null;

    this.renderMap();
    this.collision.buildFromMap(this, floor.map);
    this.cameraSystem = new CameraSystem(this, this.mapWidth, this.mapHeight);

    const spawn = this.findSpawn(floor.map);
    const startWeapon = this.shopWeapon || floor.weapon;
    this.player = new Player(this, spawn.x, spawn.y, startWeapon);
    if (this.shopPassive) this.player.applyPassive(this.shopPassive);
    if (this.registry.get('shopHeal')) {
      this.player.heal(this.player.maxHp);
      this.registry.remove('shopHeal');
    }
    this.shopWeapon = null;
    this.shopPassive = null;
    this.physics.add.collider(this.player.sprite, this.collision.getWallGroup());

    for (const ed of floor.enemies) {
      const pos = this.findEnemySpawn(floor.map);
      const enemy = new Enemy(this, pos.x, pos.y, ed);
      this.enemies.push(enemy);
      this.physics.add.collider(enemy.sprite, this.collision.getWallGroup());
    }

    if (floor.boss) {
      const center = this.getRoomCenter(floor);
      this.boss = new Boss(this, center.x, center.y, floor.boss);
      this.physics.add.collider(this.boss.sprite, this.collision.getWallGroup());
    }

    this.itemSystem.spawnItems(floor.items || []);

    this.renderExit(floor.map);
    this.cameraSystem.follow(this.player);
    this.cameraSystem.setZoom(2);

    this.minimap = new Minimap(this, floor.rooms, this.mapWidth, this.mapHeight);

    this.scene.launch('GameUI', {
      player: this.player,
      floor: this.floorNumber,
      combat: this.combat,
      boss: this.boss,
    });
  }

  private buildFallbackFloor(): void {
    this.loadingText.setVisible(false);
    this.mapData = this.generateFallbackMap();
    this.mapWidth = this.mapData[0].length * TILE_SIZE;
    this.mapHeight = this.mapData.length * TILE_SIZE;
    this.bossRoom = this.floorNumber % 3 === 0;

    this.renderMap();
    this.collision.buildFromMap(this, this.mapData);
    this.cameraSystem = new CameraSystem(this, this.mapWidth, this.mapHeight);

    const spawn = this.findSpawn(this.mapData);
    const defaultWeapon = {
      name: 'Pea Shooter',
      damage: 1,
      fireRate: 4,
      projectileSpeed: 400,
      description: 'A classic.',
    };
    const startWeapon = this.shopWeapon || defaultWeapon;
    this.player = new Player(this, spawn.x, spawn.y, startWeapon);
    if (this.shopPassive) this.player.applyPassive(this.shopPassive);
    if (this.registry.get('shopHeal')) {
      this.player.heal(this.player.maxHp);
      this.registry.remove('shopHeal');
    }
    this.shopWeapon = null;
    this.shopPassive = null;
    this.physics.add.collider(this.player.sprite, this.collision.getWallGroup());

    const enemyCount = Math.min(2 + Math.floor(this.floorNumber / 2), 8);
    const types: { melee: string[]; ranged: string[] } = {
      melee: ['Slime', 'Bat', 'Imp', 'Golem'],
      ranged: ['Archer', 'Mage'],
    };

    for (let i = 0; i < enemyCount; i++) {
      const useRanged = this.floorNumber > 2 && i % 3 === 0;
      const name = useRanged ? types.ranged[i % types.ranged.length] : types.melee[i % types.melee.length];
      const isElite = Math.random() < 0.1;
      const pos = this.findEnemySpawn(this.mapData);
      const enemy = new Enemy(this, pos.x, pos.y, {
        id: `${name.toLowerCase()}_${i}`,
        type: useRanged ? 'ranged' : 'melee',
        name,
        hp: (useRanged ? 2 : 3) + this.floorNumber + (isElite ? 3 : 0),
        speed: (useRanged ? 70 : 60) + Math.min(this.floorNumber * 2, 20),
        damage: (useRanged ? 1 : 1) + Math.floor(this.floorNumber / 4),
        spriteRecipe: getRecipeForName(name),
        isElite,
      });
      this.enemies.push(enemy);
      this.physics.add.collider(enemy.sprite, this.collision.getWallGroup());
    }

    if (this.bossRoom) {
      const center = this.getFallbackRoomCenter();
      this.boss = new Boss(this, center.x, center.y, {
        id: 'boss',
        type: 'melee',
        name: 'Boss',
        hp: 5 + this.floorNumber * 2,
        speed: 80 + this.floorNumber * 3,
        damage: 2 + Math.floor(this.floorNumber / 3),
        spriteRecipe: { body: 'square', color: '#ff4444', eyes: 'big', size: 48 },
      });
      this.physics.add.collider(this.boss.sprite, this.collision.getWallGroup());
    }

    const items: GameItemData[] = [];
    if (this.floorNumber > 1) {
      const weapons = [
        { name: 'Blaster', damage: 2, fireRate: 3, projectileSpeed: 500, description: 'Steady.' },
        { name: 'Shotstring', damage: 1, fireRate: 6, projectileSpeed: 350, description: 'Fast.' },
        { name: 'Slugger', damage: 3, fireRate: 1.5, projectileSpeed: 600, description: 'Heavy.' },
        { name: 'Spread', damage: 1, fireRate: 3, projectileSpeed: 400, description: 'Wide.' },
      ];
      const wpnPos = this.findItemSpawn(this.mapData);
      items.push({
        type: 'weapon', x: wpnPos.x, y: wpnPos.y, value: 0,
        name: weapons[this.floorNumber % weapons.length].name,
        weaponData: weapons[this.floorNumber % weapons.length],
      });
    }

    if (this.floorNumber > 3) {
      const passives: ('speed' | 'shield' | 'trishot')[] = ['speed', 'shield', 'trishot'];
      const pPos = this.findItemSpawn(this.mapData);
      items.push({
        type: 'passive', x: pPos.x, y: pPos.y, value: 0,
        name: 'Item', passiveType: passives[this.floorNumber % passives.length],
      });
    }

    const hPos = this.findItemSpawn(this.mapData);
    items.push({ type: 'health', x: hPos.x, y: hPos.y, value: 2, name: 'Health' });

    this.itemSystem.spawnItems(items);

    this.renderExit(this.mapData);
    this.cameraSystem.follow(this.player);
    this.cameraSystem.setZoom(2);

    this.minimap = new Minimap(
      this,
      this.getFallbackRooms(),
      this.mapWidth,
      this.mapHeight
    );

    this.scene.launch('GameUI', {
      player: this.player,
      floor: this.floorNumber,
      combat: this.combat,
      boss: this.boss,
    });
  }

  private renderMap(): void {
    if (this.floorBg) this.floorBg.destroy();
    this.floorBg = this.add.graphics();

    const theme = getTheme(this.floorNumber);

    for (let row = 0; row < this.mapData.length; row++) {
      for (let col = 0; col < this.mapData[row].length; col++) {
        const tile = this.mapData[row][col];
        const x = col * TILE_SIZE;
        const y = row * TILE_SIZE;

        if (tile === TILE_FLOOR) {
          this.floorBg.fillStyle(theme.floor_);
          this.floorBg.fillRect(x, y, TILE_SIZE, TILE_SIZE);
          this.floorBg.lineStyle(1, theme.floorLine);
          this.floorBg.strokeRect(x, y, TILE_SIZE, TILE_SIZE);
        } else if (tile === TILE_WALL) {
          this.floorBg.fillStyle(theme.wall);
          this.floorBg.fillRect(x, y, TILE_SIZE, TILE_SIZE);
          this.floorBg.lineStyle(1, theme.wallLine);
          this.floorBg.strokeRect(x, y, TILE_SIZE, TILE_SIZE);
        } else if (tile === TILE_DOOR) {
          this.floorBg.fillStyle(theme.door);
          this.floorBg.fillRect(x, y, TILE_SIZE, TILE_SIZE);
        }
      }
    }
  }

  private renderExit(map: number[][]): void {
    for (let row = 0; row < map.length; row++) {
      for (let col = 0; col < map[row].length; col++) {
        if (map[row][col] === TILE_EXIT) {
          const x = col * TILE_SIZE + TILE_SIZE / 2;
          const y = row * TILE_SIZE + TILE_SIZE / 2;
          const exitColor = getExitColor(this.floorNumber);
          this.exitSprite = this.add.rectangle(x, y, TILE_SIZE - 4, TILE_SIZE - 4, exitColor);
          this.exitSprite.setDepth(5);
          this.tweens.add({
            targets: this.exitSprite,
            alpha: { from: 1, to: 0.4 },
            duration: 600,
            yoyo: true,
            repeat: -1,
          });
          return;
        }
      }
    }
  }

  private findSpawn(map: number[][]): { x: number; y: number } {
    for (let row = 0; row < map.length; row++) {
      for (let col = 0; col < map[row].length; col++) {
        if (map[row][col] === TILE_FLOOR) {
          return { x: col * TILE_SIZE + TILE_SIZE / 2, y: row * TILE_SIZE + TILE_SIZE / 2 };
        }
      }
    }
    return { x: TILE_SIZE, y: TILE_SIZE };
  }

  private findEnemySpawn(map: number[][]): { x: number; y: number } {
    const pRow = this.player ? Math.floor(this.player.sprite.y / TILE_SIZE) : 0;
    const pCol = this.player ? Math.floor(this.player.sprite.x / TILE_SIZE) : 0;
    for (let attempts = 0; attempts < 50; attempts++) {
      const row = Phaser.Math.Between(1, map.length - 2);
      const col = Phaser.Math.Between(1, map[0].length - 2);
      if (map[row][col] === TILE_FLOOR) {
        const dist = Math.abs(row - pRow) + Math.abs(col - pCol);
        if (dist > 5) {
          return { x: col * TILE_SIZE + TILE_SIZE / 2, y: row * TILE_SIZE + TILE_SIZE / 2 };
        }
      }
    }
    return { x: TILE_SIZE * 3, y: TILE_SIZE * 3 };
  }

  private findItemSpawn(map: number[][]): { x: number; y: number } {
    for (let attempts = 0; attempts < 30; attempts++) {
      const row = Phaser.Math.Between(2, map.length - 3);
      const col = Phaser.Math.Between(2, map[0].length - 3);
      if (map[row][col] === TILE_FLOOR) {
        return { x: col * TILE_SIZE + TILE_SIZE / 2, y: row * TILE_SIZE + TILE_SIZE / 2 };
      }
    }
    return { x: TILE_SIZE * 5, y: TILE_SIZE * 5 };
  }

  private getRoomCenter(floor: FloorData): { x: number; y: number } {
    if (floor.rooms.length > 0) {
      const last = floor.rooms[floor.rooms.length - 1];
      return {
        x: (last.x + last.w / 2) * TILE_SIZE,
        y: (last.y + last.h / 2) * TILE_SIZE,
      };
    }
    return { x: TILE_SIZE * 10, y: TILE_SIZE * 10 };
  }

  private getFallbackRoomCenter(): { x: number; y: number } {
    const rooms = this.getFallbackRooms();
    const last = rooms[rooms.length - 1];
    return {
      x: (last.x + last.w / 2) * TILE_SIZE,
      y: (last.y + last.h / 2) * TILE_SIZE,
    };
  }

  private getFallbackRooms() {
    return [
      { x: 2, y: 2, w: 8, h: 6, doors: [{ dir: 'e' as const, x: 9, y: 5 }] },
      { x: 14, y: 2, w: 10, h: 6, doors: [{ dir: 'w' as const, x: 14, y: 5 }, { dir: 'e' as const, x: 23, y: 5 }] },
      { x: 28, y: 2, w: 8, h: 8, doors: [{ dir: 'w' as const, x: 28, y: 6 }] },
      { x: 2, y: 12, w: 10, h: 8, doors: [{ dir: 'e' as const, x: 11, y: 16 }] },
      { x: 16, y: 14, w: 10, h: 8, doors: [{ dir: 'w' as const, x: 16, y: 18 }, { dir: 'e' as const, x: 25, y: 18 }] },
      { x: 28, y: 14, w: 8, h: 8, doors: [{ dir: 'w' as const, x: 28, y: 18 }] },
    ];
  }

  private generateFallbackMap(): number[][] {
    const rows = 25;
    const cols = 40;
    const map: number[][] = [];

    for (let r = 0; r < rows; r++) {
      map[r] = [];
      for (let c = 0; c < cols; c++) {
        if (r === 0 || r === rows - 1 || c === 0 || c === cols - 1) {
          map[r][c] = TILE_WALL;
        } else {
          map[r][c] = TILE_FLOOR;
        }
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

    const bossRoom = this.bossRoom;
    const bossRoomIdx = rooms.length - 1;

    for (let i = 0; i < rooms.length; i++) {
      const room = rooms[i];
      const isBossRoom = bossRoom && i === bossRoomIdx;
      const mult = isBossRoom ? 2 : 1;
      const actualW = room.w * mult;
      const actualH = room.h * mult;

      for (let r = room.y; r < room.y + actualH; r++) {
        for (let c = room.x; c < room.x + actualW; c++) {
          if (r === room.y || r === room.y + actualH - 1 || c === room.x || c === room.x + actualW - 1) {
            map[r][c] = TILE_WALL;
          } else {
            map[r][c] = TILE_FLOOR;
          }
        }
      }

      map[room.y + Math.floor(actualH / 2)][room.x] = TILE_DOOR;
      map[room.y + Math.floor(actualH / 2)][room.x + actualW - 1] = TILE_DOOR;
    }

    if (!bossRoom) {
      const lastRoom = rooms[rooms.length - 1];
      map[lastRoom.y + Math.floor(lastRoom.h / 2)][lastRoom.x + lastRoom.w - 2] = TILE_EXIT;
    }

    return map;
  }

  update(time: number): void {
    if (!this.player || this.transitioning) {
      if (this.escKey && Phaser.Input.Keyboard.JustDown(this.escKey) && !this.transitioning) {
        this.openPause();
      }
      return;
    }

    if (Phaser.Input.Keyboard.JustDown(this.escKey)) {
      this.openPause();
      return;
    }

    if (!this.player.alive) {
      audio.playPlayerDeath();
      this.scene.stop('GameUI');
      const totalScore = this.registry.get('totalScore') ?? 0;
      const totalKills = this.registry.get('totalKills') ?? 0;
      this.registry.set('totalScore', totalScore + this.combat.getScore());
      this.registry.set('totalKills', totalKills + this.kills);
      this.time.delayedCall(800, () => {
        this.scene.start('GameOverScene', {
          floor: this.floorNumber,
          score: this.registry.get('totalScore'),
          gold: this.registry.get('gold'),
          kills: this.registry.get('totalKills'),
        });
      });
      return;
    }

    this.player.update(this.cursors, this.wasd, time);

    for (const enemy of this.enemies) {
      if (enemy.alive) enemy.update(this.player.sprite.x, this.player.sprite.y);
    }

    if (this.boss && this.boss.alive) {
      this.boss.update(this.player.sprite.x, this.player.sprite.y, time);
    }

    if (this.player.canFire(time)) {
      const pointer = this.input.activePointer;
      const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
      const angle = Phaser.Math.Angle.Between(
        this.player.sprite.x, this.player.sprite.y,
        worldPoint.x, worldPoint.y
      );

      if (this.player.hasTriShot()) {
        for (let i = -1; i <= 1; i++) {
          const a = angle + i * 0.087;
          const proj = new Projectile(this, this.player.sprite.x, this.player.sprite.y, a, this.player.weapon.projectileSpeed * 0.8, this.player.weapon.damage);
          this.combat.addProjectile(proj);
          this.physics.add.collider(proj.sprite, this.collision.getWallGroup(), () => proj.kill());
        }
      } else {
        const proj = new Projectile(this, this.player.sprite.x, this.player.sprite.y, angle, this.player.weapon.projectileSpeed, this.player.weapon.damage);
        this.combat.addProjectile(proj);
        this.physics.add.collider(proj.sprite, this.collision.getWallGroup(), () => proj.kill());
      }

      this.player.fire(time);
      audio.playShoot();
    }

    this.combat.update(this.player, this.enemies, this.boss, time);

    this.kills = this.enemies.filter(e => !e.alive).length + (this.boss && !this.boss.alive ? 1 : 0);

    for (const enemy of this.enemies) {
      if (!enemy.alive) continue;
      this.physics.add.collider(enemy.sprite, this.collision.getWallGroup());
    }

    if (this.boss && this.boss.alive) {
      this.physics.add.collider(this.boss.sprite, this.collision.getWallGroup());
      for (const ep of this.boss.enemyProjectiles) {
        if (ep.alive) {
          this.physics.add.collider(ep.sprite, this.collision.getWallGroup(), () => ep.kill());
        }
      }
    }

    this.itemSystem.checkPickups(this.player);
    this.minimap?.update(this.player, this.exitSprite);

    if (this.minimap) {
      this.minimap.discoverRoom(this.player.sprite.x, this.player.sprite.y);
    }

    if (this.bossRoom && this.boss && !this.boss.alive) {
      this.bossRoom = false;
      const exitPos = this.findItemSpawn(this.mapData);
      this.exitSprite = this.add.rectangle(exitPos.x, exitPos.y, TILE_SIZE - 4, TILE_SIZE - 4, getExitColor(this.floorNumber));
      this.exitSprite.setDepth(5);
      this.tweens.add({
        targets: this.exitSprite,
        alpha: { from: 1, to: 0.4 },
        duration: 600,
        yoyo: true,
        repeat: -1,
      });
    }

    if (this.exitSprite && this.exitSprite.active && this.player.sprite) {
      const dx = this.player.sprite.x - this.exitSprite.x;
      const dy = this.player.sprite.y - this.exitSprite.y;
      if (Math.sqrt(dx * dx + dy * dy) < 24) {
        this.startFloorTransition();
      }
    }
  }

  private openPause(): void {
    this.scene.pause();
    this.scene.launch('PauseScene');
  }

  private startFloorTransition(): void {
    this.transitioning = true;
    (this.player.sprite as unknown as { body: Phaser.Physics.Arcade.Body }).body.setVelocity(0, 0);
    audio.playFloorClear();

    const totalScore = this.registry.get('totalScore') ?? 0;
    this.registry.set('totalScore', totalScore + this.combat.getScore());
    this.registry.set('gold', this.gold);
    const totalKills = this.registry.get('totalKills') ?? 0;
    this.registry.set('totalKills', totalKills + this.kills);

    this.cameras.main.fadeOut(400, 0, 0, 0);

    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.enemies.forEach(e => e.destroy());
      this.enemies = [];
      if (this.boss) { this.boss.destroy(); this.boss = null; }
      this.player.destroy();
      this.combat.clear();
      this.itemSystem.clear();
      if (this.exitSprite) this.exitSprite.destroy();
      if (this.minimap) { this.minimap.destroy(); }
      this.scene.stop('GameUI');

      this.scene.start('ShopScene', {
        floorNumber: this.floorNumber,
        gold: this.gold,
      });
    });
  }
}

function getRecipeForName(name: string): { body: string; color: string; eyes: string; size: number } {
  const recipes: Record<string, { body: string; color: string; eyes: string; size: number }> = {
    Slime: { body: 'blob', color: '#44aa44', eyes: 'dots', size: 24 },
    Bat: { body: 'triangle', color: '#8844aa', eyes: 'dots', size: 20 },
    Imp: { body: 'square', color: '#cc4444', eyes: 'big', size: 28 },
    Golem: { body: 'diamond', color: '#886644', eyes: 'slits', size: 32 },
    Archer: { body: 'cross', color: '#44aaff', eyes: 'dots', size: 24 },
    Mage: { body: 'star', color: '#aa44ff', eyes: 'glow', size: 26 },
  };
  return recipes[name] || recipes.Slime;
}
