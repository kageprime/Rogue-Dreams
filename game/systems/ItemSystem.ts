import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { ItemEntity } from '../entities/Item';
import { GameItemData, PassiveItemType } from '../types';
import { audio } from './Audio';

export class ItemSystem {
  private scene: Phaser.Scene;
  private items: ItemEntity[] = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  spawnItems(itemData: GameItemData[]): void {
    for (const data of itemData) {
      const item = new ItemEntity(this.scene, data);
      this.items.push(item);
    }
  }

  checkPickups(player: Player): void {
    for (let i = this.items.length - 1; i >= 0; i--) {
      const item = this.items[i];
      if (item.collected) {
        this.items.splice(i, 1);
        continue;
      }

      const dx = player.sprite.x - item.sprite.x;
      const dy = player.sprite.y - item.sprite.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 20) {
        this.applyItem(player, item.data);
        item.pickup();
        this.items.splice(i, 1);
      }
    }
  }

  private applyItem(player: Player, data: GameItemData): void {
    audio.playPickup();

    switch (data.type) {
      case 'health':
        player.heal(data.value);
        this.showNotification(`+${data.value} HP`);
        break;
      case 'weapon':
        if (data.weaponData) {
          player.weapon = data.weaponData;
          this.showNotification(`Equipped: ${data.weaponData.name}`);
        }
        break;
      case 'passive':
        if (data.passiveType) {
          player.applyPassive(data.passiveType);
          const names: Record<PassiveItemType, string> = {
            speed: 'Boots of Speed',
            shield: 'Shield',
            trishot: 'Tri-Shot',
          };
          this.showNotification(`Got: ${names[data.passiveType]}`);
        }
        break;
    }
  }

  private showNotification(text: string): void {
    const txt = this.scene.add.text(400, 160, text, {
      fontSize: '14px',
      color: '#ffcc44',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    });
    txt.setOrigin(0.5);
    txt.setDepth(50);

    this.scene.tweens.add({
      targets: txt,
      y: 130,
      alpha: 0,
      duration: 1200,
      ease: 'Power1',
      onComplete: () => txt.destroy(),
    });
  }

  clear(): void {
    for (const item of this.items) item.destroy();
    this.items = [];
  }

  destroy(): void {
    this.clear();
  }
}
