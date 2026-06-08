import Phaser from 'phaser';
import { Effects } from '../systems/Effects';

export class Projectile {
  public sprite: Phaser.GameObjects.Arc;
  public damage: number;
  public alive: boolean = true;
  private scene: Phaser.Scene;
  private trailTimer: number = 0;
  private trailColor: number;

  constructor(scene: Phaser.Scene, x: number, y: number, angle: number, speed: number, damage: number) {
    this.scene = scene;
    this.damage = damage;
    this.trailColor = 0xffff44;

    this.sprite = scene.add.circle(x, y, 4, this.trailColor);
    this.sprite.setDepth(9);

    scene.physics.add.existing(this.sprite);
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setCircle(4);
    body.setVelocity(
      Math.cos(angle) * speed,
      Math.sin(angle) * speed
    );
    body.setBounce(0);
  }

  update(): void {
    if (!this.alive) return;

    this.trailTimer++;
    if (this.trailTimer % 2 === 0) {
      Effects.makeTrail(this.scene, this.sprite.x, this.sprite.y, this.trailColor);
    }

    if (
      this.sprite.x < -50 || this.sprite.x > 850 ||
      this.sprite.y < -50 || this.sprite.y > 650
    ) {
      this.kill();
    }
  }

  kill(): void {
    this.alive = false;
    this.sprite.setVisible(false);
    (this.sprite.body as Phaser.Physics.Arcade.Body).enable = false;
  }

  destroy(): void {
    this.sprite.destroy();
  }
}
