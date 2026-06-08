import Phaser from 'phaser';
import { EnemyData } from '../types';
import { EnemyProjectile } from './EnemyProjectile';

type BossPhase = 'idle' | 'charge' | 'barrage' | 'slam';

export class Boss {
  public sprite: Phaser.GameObjects.Rectangle;
  public data: EnemyData;
  public hp: number;
  public maxHp: number;
  public alive: boolean = true;
  public scene: Phaser.Scene;
  public enemyProjectiles: EnemyProjectile[] = [];
  public onHpChange?: (hp: number, maxHp: number) => void;
  private phase: BossPhase = 'idle';
  private speed: number = 100;
  public damage: number = 2;
  private lastAction: number = 0;
  private phaseTimer: number = 0;
  private chargeTarget: { x: number; y: number } | null = null;
  private slamDone: boolean = false;

  constructor(scene: Phaser.Scene, x: number, y: number, data: EnemyData) {
    this.scene = scene;
    this.data = data;
    this.maxHp = data.hp * 3;
    this.hp = this.maxHp;
    this.speed = data.speed;
    this.damage = data.damage;

    this.sprite = scene.add.rectangle(x, y, 48, 48, 0xff4444);
    this.sprite.setStrokeStyle(2, 0xffaa44);
    this.sprite.setDepth(10);

    scene.physics.add.existing(this.sprite);
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setCollideWorldBounds(true);
  }

  update(playerX: number, playerY: number, time: number): void {
    if (!this.alive) return;

    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    const dx = playerX - this.sprite.x;
    const dy = playerY - this.sprite.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    const hpPercent = this.hp / this.maxHp;

    if (time - this.lastAction < this.phaseTimer) {
      if (this.phase === 'charge' && this.chargeTarget) {
        const cdx = this.chargeTarget.x - this.sprite.x;
        const cdy = this.chargeTarget.y - this.sprite.y;
        const cd = Math.sqrt(cdx * cdx + cdy * cdy);
        if (cd > 10) {
          body.setVelocity((cdx / cd) * this.speed * 2.5, (cdy / cd) * this.speed * 2.5);
        } else {
          body.setVelocity(0, 0);
          this.phase = 'idle';
        }
      } else if (this.phase === 'slam' && !this.slamDone) {
        this.slamDone = true;
        const shockwave = this.scene.add.circle(this.sprite.x, this.sprite.y, 10, 0xff8844, 0.5);
        shockwave.setDepth(12);
        this.scene.tweens.add({
          targets: shockwave,
          scaleX: 4, scaleY: 4,
          alpha: 0,
          duration: 400,
          onComplete: () => shockwave.destroy(),
        });
        this.scene.time.delayedCall(500, () => { this.phase = 'idle'; this.slamDone = false; });
      }
      return;
    }

    this.lastAction = time;

    if (hpPercent > 0.6) {
      this.phase = 'charge';
      this.phaseTimer = 800;
      this.chargeTarget = { x: playerX, y: playerY };
    } else if (hpPercent > 0.3) {
      this.phase = 'barrage';
      this.phaseTimer = 1200;
      for (let i = -1; i <= 1; i++) {
        const angle = Math.atan2(dy, dx) + i * 0.2;
        const proj = new EnemyProjectile(
          this.scene, this.sprite.x, this.sprite.y,
          Math.cos(angle), Math.sin(angle),
          120, this.damage
        );
        this.enemyProjectiles.push(proj);
      }
    } else {
      this.phase = 'slam';
      this.phaseTimer = 1000;
      if (dist < 150) {
        body.setVelocity(-(dx / dist) * this.speed * 3, -(dy / dist) * this.speed * 3);
      }
    }
  }

  getHpPercent(): number {
    return this.hp / this.maxHp;
  }

  canAttack(): boolean {
    return true;
  }

  attack(): void {}

  takeDamage(amount: number): void {
    if (!this.alive) return;
    this.hp -= amount;
    this.sprite.setFillStyle(0xffffff);
    this.scene.time.delayedCall(80, () => {
      if (this.sprite.active) this.sprite.setFillStyle(0xff4444);
    });
    if (this.onHpChange) this.onHpChange(this.hp, this.maxHp);

    if (this.hp <= 0) {
      this.hp = 0;
      this.alive = false;
      this.sprite.setVisible(false);
      (this.sprite.body as Phaser.Physics.Arcade.Body).enable = false;
      for (const p of this.enemyProjectiles) p.kill();
    }
  }

  destroy(): void {
    for (const p of this.enemyProjectiles) p.destroy();
    this.enemyProjectiles = [];
    this.sprite.destroy();
  }
}
