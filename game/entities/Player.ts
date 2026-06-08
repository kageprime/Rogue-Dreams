import Phaser from 'phaser';
import { WeaponData, PassiveItemType } from '../types';
import { TILE_SIZE } from '../types';

export class Player {
  public sprite: Phaser.GameObjects.Arc;
  public hp: number;
  public maxHp: number;
  public weapon: WeaponData;
  public alive: boolean = true;
  public scene: Phaser.Scene;
  public passiveItems: Set<PassiveItemType> = new Set();
  private lastFired: number = 0;
  private speed: number = 160;
  private invulnerable: boolean = false;
  private invulnTimer: number = 0;
  private originalColor: number = 0x44aaff;
  private damageReduction: number = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, weapon: WeaponData) {
    this.scene = scene;
    this.maxHp = 6;
    this.hp = this.maxHp;
    this.weapon = weapon;

    this.sprite = scene.add.circle(x, y, TILE_SIZE / 2 - 2, this.originalColor);
    this.sprite.setDepth(10);

    scene.physics.add.existing(this.sprite);
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setCollideWorldBounds(true);
    body.setCircle(TILE_SIZE / 2 - 2);

    this.setupPhysics(body);
  }

  private setupPhysics(body: Phaser.Physics.Arcade.Body): void {
    body.setDrag(600);
    body.setMaxVelocity(this.speed);
  }

  getSpeed(): number {
    return this.passiveItems.has('speed') ? this.speed * 1.3 : this.speed;
  }

  getDamageReduction(): number {
    return this.passiveItems.has('shield') ? 1 : 0;
  }

  hasTriShot(): boolean {
    return this.passiveItems.has('trishot');
  }

  applyPassive(type: PassiveItemType): void {
    this.passiveItems.add(type);
    if (type === 'shield') {
      this.maxHp += 2;
      this.hp = Math.min(this.hp + 2, this.maxHp);
    }
  }

  update(cursors: Phaser.Types.Input.Keyboard.CursorKeys, wasd: Record<string, Phaser.Input.Keyboard.Key>, time: number): void {
    if (!this.alive) return;

    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    let vx = 0;
    let vy = 0;

    if (cursors.left.isDown || wasd.a.isDown) vx = -1;
    else if (cursors.right.isDown || wasd.d.isDown) vx = 1;
    if (cursors.up.isDown || wasd.w.isDown) vy = -1;
    else if (cursors.down.isDown || wasd.s.isDown) vy = 1;

    const len = Math.sqrt(vx * vx + vy * vy);
    if (len > 0) {
      vx /= len;
      vy /= len;
    }

    const currentSpeed = this.getSpeed();
    body.setVelocity(vx * currentSpeed, vy * currentSpeed);

    if (this.invulnerable) {
      this.invulnTimer -= 1;
      this.sprite.setAlpha(Math.sin(time * 0.01) > 0 ? 1 : 0.3);
      if (this.invulnTimer <= 0) {
        this.invulnerable = false;
        this.sprite.setAlpha(1);
      }
    }
  }

  canFire(time: number): boolean {
    return this.alive && time - this.lastFired >= (1000 / this.weapon.fireRate);
  }

  fire(time: number): void {
    this.lastFired = time;
  }

  hitFlash(): void {
    if (!this.alive) return;
    this.sprite.setFillStyle(0xff4444);
    this.scene.time.delayedCall(80, () => {
      if (this.sprite.active) this.sprite.setFillStyle(this.originalColor);
    });
  }

  takeDamage(amount: number): void {
    if (this.invulnerable || !this.alive) return;
    const actualDmg = Math.max(0, amount - this.getDamageReduction());
    this.hp -= actualDmg;
    this.invulnerable = true;
    this.invulnTimer = 30;
    this.hitFlash();
    if (this.hp <= 0) {
      this.hp = 0;
      this.alive = false;
      this.sprite.setVisible(false);
    }
  }

  heal(amount: number): void {
    this.hp = Math.min(this.maxHp, this.hp + amount);
  }

  destroy(): void {
    this.sprite.destroy();
  }
}
