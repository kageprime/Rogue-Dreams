import Phaser from 'phaser';
import { EnemyData } from '../types';
import { DEFAULT_SPRITE_RECIPES } from '../generation/sprites';
import { EnemyProjectile } from './EnemyProjectile';

export class Enemy {
  public sprite: Phaser.GameObjects.Rectangle | Phaser.GameObjects.Image;
  public data: EnemyData;
  public hp: number;
  public alive: boolean = true;
  public scene: Phaser.Scene;
  public enemyProjectiles: EnemyProjectile[] = [];
  public isElite: boolean = false;
  private speed: number;
  private damage: number;
  private lastAttack: number = 0;
  private attackCooldown: number = 1000;
  private originalFillColor: number = 0x44aa44;

  constructor(scene: Phaser.Scene, x: number, y: number, data: EnemyData) {
    this.scene = scene;
    this.data = data;
    this.hp = data.hp;
    this.speed = data.speed;
    this.damage = data.damage;
    this.isElite = data.isElite || false;

    const recipe = data.spriteRecipe || DEFAULT_SPRITE_RECIPES.slime;
    const size = recipe.size || 24;
    this.originalFillColor = parseColor(recipe.color);

    const textureKey = this.getTextureKey(data);
    if (textureKey && scene.textures.exists(textureKey)) {
      this.sprite = scene.add.image(x, y, textureKey);
      this.sprite.setDisplaySize(size, size);
    } else {
      this.sprite = scene.add.rectangle(x, y, size, size, this.originalFillColor);
    }

    if (this.isElite && this.sprite instanceof Phaser.GameObjects.Rectangle) {
      this.sprite.setStrokeStyle(2, 0xffdd44);
    }

    this.sprite.setDepth(8);

    scene.physics.add.existing(this.sprite);
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setCollideWorldBounds(true);
  }

  private getTextureKey(data: EnemyData): string | null {
    const name = data.name?.toLowerCase() || 'slime';
    if (name.includes('slime')) return 'enemy_slime';
    if (name.includes('bat')) return 'enemy_bat';
    if (name.includes('imp')) return 'enemy_imp';
    if (name.includes('golem')) return 'enemy_golem';
    if (name.includes('archer')) return 'enemy_archer';
    if (name.includes('mage')) return 'enemy_mage';
    return null;
  }

  update(playerX: number, playerY: number): void {
    if (!this.alive) return;

    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    const dx = playerX - this.sprite.x;
    const dy = playerY - this.sprite.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (this.data.type === 'ranged') {
      if (dist < 250 && dist > 80) {
        body.setVelocity(0, 0);
      } else if (dist <= 80) {
        body.setVelocity(
          -(dx / dist) * this.speed,
          -(dy / dist) * this.speed
        );
      } else {
        body.setVelocity(
          (dx / dist) * this.speed,
          (dy / dist) * this.speed
        );
      }
    } else {
      if (dist < 200 && dist > 20) {
        body.setVelocity(
          (dx / dist) * this.speed,
          (dy / dist) * this.speed
        );
      } else {
        body.setVelocity(0, 0);
      }
    }
  }

  canAttack(time: number): boolean {
    return time - this.lastAttack >= this.attackCooldown;
  }

  canFireProjectile(time: number): boolean {
    return time - this.lastAttack >= 1500;
  }

  attack(time: number): void {
    this.lastAttack = time;
  }

  fireProjectile(playerX: number, playerY: number): EnemyProjectile | null {
    if (!this.alive) return null;
    if (this.data.type !== 'ranged') return null;

    const dx = playerX - this.sprite.x;
    const dy = playerY - this.sprite.y;
    const proj = new EnemyProjectile(
      this.scene,
      this.sprite.x, this.sprite.y,
      dx, dy,
      150, this.damage
    );
    this.enemyProjectiles.push(proj);
    this.lastAttack = this.scene.time.now;
    return proj;
  }

  hitFlash(): void {
    if (!this.alive) return;
    if (this.sprite instanceof Phaser.GameObjects.Rectangle) {
      (this.sprite as Phaser.GameObjects.Rectangle).setFillStyle(0xffffff);
      this.scene.time.delayedCall(80, () => {
        if (this.sprite.active) {
          (this.sprite as Phaser.GameObjects.Rectangle).setFillStyle(this.originalFillColor);
        }
      });
    }
  }

  takeDamage(amount: number): void {
    if (!this.alive) return;
    this.hp -= amount;
    this.hitFlash();

    if (this.hp <= 0) {
      this.alive = false;
      this.sprite.setVisible(false);
      (this.sprite.body as Phaser.Physics.Arcade.Body).enable = false;
      for (const p of this.enemyProjectiles) {
        if (p.alive) p.kill();
      }
    }
  }

  destroy(): void {
    for (const p of this.enemyProjectiles) p.destroy();
    this.enemyProjectiles = [];
    this.sprite.destroy();
  }
}

function parseColor(hex: string): number {
  return parseInt(hex.replace('#', ''), 16);
}
