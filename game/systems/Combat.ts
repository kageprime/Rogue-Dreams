import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { Boss } from '../entities/Boss';
import { Projectile } from '../entities/Projectile';
import { EnemyProjectile } from '../entities/EnemyProjectile';
import { Effects } from './Effects';
import { audio } from './Audio';

export class CombatSystem {
  private scene: Phaser.Scene;
  private playerProjectiles: Projectile[] = [];
  private enemyProjectiles: EnemyProjectile[] = [];
  private score: number = 0;
  public onGoldDrop?: (amount: number) => void;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  addProjectile(p: Projectile): void {
    this.playerProjectiles.push(p);
  }

  addEnemyProjectile(p: EnemyProjectile): void {
    this.enemyProjectiles.push(p);
  }

  update(player: Player, enemies: Enemy[], boss: Boss | null, time: number): void {
    this.updateProjectiles(player, enemies, boss);
    this.checkEnemyCollisions(player, enemies, time);
    this.updateEnemyProjectiles(player);
    if (boss) this.checkBossCollision(player, boss);
  }

  private updateProjectiles(player: Player, enemies: Enemy[], boss: Boss | null): void {
    for (let i = this.playerProjectiles.length - 1; i >= 0; i--) {
      const p = this.playerProjectiles[i];
      if (!p.alive) {
        p.destroy();
        this.playerProjectiles.splice(i, 1);
        continue;
      }

      p.update();

      for (const enemy of enemies) {
        if (!enemy.alive) continue;
        const dx = p.sprite.x - enemy.sprite.x;
        const dy = p.sprite.y - enemy.sprite.y;
        if (Math.sqrt(dx * dx + dy * dy) < 20) {
          enemy.takeDamage(p.damage);
          Effects.shakeCamera(this.scene, 0.002, 50);
          audio.playHit();
          Effects.showDamageNumber(this.scene, enemy.sprite.x, enemy.sprite.y - 10, p.damage);
          p.kill();
          if (!enemy.alive) {
            this.score += 10;
            audio.playEnemyDeath();
            Effects.shakeCamera(this.scene, 0.004, 80);
            Effects.emitParticles(
              this.scene, enemy.sprite.x, enemy.sprite.y,
              enemy.data.spriteRecipe ? parseInt(enemy.data.spriteRecipe.color.replace('#', ''), 16) : 0x44aa44, 10
            );
            const goldAmount = Phaser.Math.Between(1, 3);
            if (this.onGoldDrop) this.onGoldDrop(goldAmount);
          }
          break;
        }
      }

      if (boss && boss.alive) {
        const dbx = p.sprite.x - boss.sprite.x;
        const dby = p.sprite.y - boss.sprite.y;
        if (Math.sqrt(dbx * dbx + dby * dby) < 28) {
          boss.takeDamage(p.damage);
          Effects.shakeCamera(this.scene, 0.003, 60);
          audio.playHit();
          Effects.showDamageNumber(this.scene, boss.sprite.x, boss.sprite.y - 20, p.damage);
          p.kill();
        }
      }
    }
  }

  private updateEnemyProjectiles(player: Player): void {
    for (let i = this.enemyProjectiles.length - 1; i >= 0; i--) {
      const p = this.enemyProjectiles[i];
      if (!p.alive) {
        p.destroy();
        this.enemyProjectiles.splice(i, 1);
        continue;
      }

      p.update();

      if (!player.alive) continue;
      const dx = p.sprite.x - player.sprite.x;
      const dy = p.sprite.y - player.sprite.y;
      if (Math.sqrt(dx * dx + dy * dy) < 16) {
        player.takeDamage(p.damage);
        Effects.shakeCamera(this.scene, 0.006, 100);
        audio.playPlayerHit();
        p.kill();
      }
    }
  }

  private checkEnemyCollisions(player: Player, enemies: Enemy[], time: number): void {
    for (const enemy of enemies) {
      if (!enemy.alive || !player.alive) continue;
      const dx = player.sprite.x - enemy.sprite.x;
      const dy = player.sprite.y - enemy.sprite.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 24 && enemy.canAttack(time)) {
        player.takeDamage(enemy.data.damage);
        enemy.attack(time);
        Effects.shakeCamera(this.scene, 0.008, 120);
        audio.playPlayerHit();
      }

      if (enemy.data.type === 'ranged' && dist < 250 && enemy.canFireProjectile(time)) {
        const proj = enemy.fireProjectile(player.sprite.x, player.sprite.y);
        if (proj) this.addEnemyProjectile(proj);
      }
    }
  }

  private checkBossCollision(player: Player, boss: Boss): void {
    if (!boss.alive || !player.alive) return;
    const dx = player.sprite.x - boss.sprite.x;
    const dy = player.sprite.y - boss.sprite.y;
    if (Math.sqrt(dx * dx + dy * dy) < 32) {
      player.takeDamage(boss.damage);
      Effects.shakeCamera(this.scene, 0.01, 150);
      audio.playPlayerHit();
    }
  }

  getScore(): number {
    return this.score;
  }

  clear(): void {
    for (const p of this.playerProjectiles) p.destroy();
    for (const p of this.enemyProjectiles) p.destroy();
    this.playerProjectiles = [];
    this.enemyProjectiles = [];
    this.score = 0;
  }

  destroy(): void {
    this.clear();
  }
}
