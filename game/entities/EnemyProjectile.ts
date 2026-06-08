import Phaser from 'phaser';

export class EnemyProjectile {
  public sprite: Phaser.GameObjects.Arc;
  public damage: number;
  public alive: boolean = true;

  constructor(scene: Phaser.Scene, x: number, y: number, dx: number, dy: number, speed: number, damage: number) {
    this.damage = damage;

    this.sprite = scene.add.circle(x, y, 4, 0xff4444);
    this.sprite.setDepth(9);

    scene.physics.add.existing(this.sprite);
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setCircle(4);

    const len = Math.sqrt(dx * dx + dy * dy);
    body.setVelocity(
      (dx / len) * speed,
      (dy / len) * speed
    );
    body.setBounce(0);
  }

  update(): void {
    if (!this.alive) return;
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
