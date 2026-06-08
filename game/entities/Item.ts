import Phaser from 'phaser';
import { GameItemData } from '../types';

export class ItemEntity {
  public sprite: Phaser.GameObjects.Rectangle;
  public label: Phaser.GameObjects.Text;
  public data: GameItemData;
  public collected: boolean = false;

  constructor(scene: Phaser.Scene, data: GameItemData) {
    this.data = data;

    const color = data.type === 'weapon' ? 0xffaa44 :
                  data.type === 'passive' ? 0xaa44ff : 0x44ff44;

    this.sprite = scene.add.rectangle(data.x, data.y, 16, 16, color);
    this.sprite.setDepth(6);

    scene.tweens.add({
      targets: this.sprite,
      y: data.y - 4,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    const name = data.name || 'Item';
    this.label = scene.add.text(data.x, data.y + 14, name, {
      fontSize: '9px',
      color: '#ffffff',
      fontFamily: 'monospace',
    });
    this.label.setOrigin(0.5, 0);
    this.label.setDepth(6);

    scene.physics.add.existing(this.sprite);
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setImmovable(true);
    body.setSize(16, 16);
  }

  pickup(): void {
    this.collected = true;
    this.sprite.destroy();
    this.label.destroy();
  }

  destroy(): void {
    if (this.sprite.active) this.sprite.destroy();
    if (this.label.active) this.label.destroy();
  }
}
