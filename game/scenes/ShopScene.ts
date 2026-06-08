import Phaser from 'phaser';
import { audio } from '../systems/Audio';

interface ShopItem {
  name: string;
  description: string;
  price: number;
  bought: boolean;
  color: string;
  onBuy: () => void;
}

export class ShopScene extends Phaser.Scene {
  private gold: number = 0;
  private floorNumber: number = 1;
  private items: ShopItem[] = [];
  private goldText!: Phaser.GameObjects.Text;
  private itemCards: Phaser.GameObjects.Container[] = [];

  constructor() {
    super({ key: 'ShopScene' });
  }

  init(data: { gold?: number; floorNumber?: number }): void {
    this.gold = data.gold ?? this.registry.get('gold') ?? 0;
    this.floorNumber = data.floorNumber ?? 1;
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#0a0a1e');
    this.cameras.main.fadeIn(300);

    this.drawGridBackground();

    const title = this.add.text(400, 40, `S H O P  —  FLOOR ${this.floorNumber}`, {
      fontSize: '28px',
      color: '#44aaff',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5);

    this.goldText = this.add.text(400, 80, `Gold: ${this.gold}`, {
      fontSize: '18px',
      color: '#ffcc44',
      fontFamily: 'monospace',
    });
    this.goldText.setOrigin(0.5);

    this.items = this.buildItems();
    this.drawItems();

    const hint = this.add.text(400, 530, 'Click an item to buy  ·  SPACE / ENTER to leave', {
      fontSize: '11px',
      color: '#666688',
      fontFamily: 'monospace',
    });
    hint.setOrigin(0.5);

    this.input.keyboard!.once('keydown-SPACE', () => this.leaveShop());
    this.input.keyboard!.once('keydown-ENTER', () => this.leaveShop());
  }

  private drawGridBackground(): void {
    const g = this.add.graphics();
    g.lineStyle(1, 0x333366, 0.3);
    for (let x = 0; x < 800; x += 40) {
      g.lineBetween(x, 0, x, 600);
    }
    for (let y = 0; y < 600; y += 40) {
      g.lineBetween(0, y, 800, y);
    }

    g.lineStyle(2, 0x44aaff, 0.08);
    g.lineBetween(0, 110, 800, 110);
    g.lineBetween(0, 520, 800, 520);
  }

  private buildItems(): ShopItem[] {
    return [
      {
        name: 'Health Potion',
        description: 'Restore all HP',
        price: 3,
        bought: false,
        color: '#44ff44',
        onBuy: () => {
          this.registry.set('shopHeal', true);
        },
      },
      {
        name: 'Weapon Upgrade',
        description: 'Random new weapon',
        price: 5,
        bought: false,
        color: '#ff6644',
        onBuy: () => {
          const weapons = [
            { name: 'Blaster', damage: 2, fireRate: 3, projectileSpeed: 500, description: 'Steady.' },
            { name: 'Shotstring', damage: 1, fireRate: 6, projectileSpeed: 350, description: 'Fast.' },
            { name: 'Slugger', damage: 3, fireRate: 1.5, projectileSpeed: 600, description: 'Heavy.' },
            { name: 'Spread', damage: 1, fireRate: 3, projectileSpeed: 400, description: 'Wide.' },
            { name: 'Railgun', damage: 4, fireRate: 1, projectileSpeed: 800, description: 'Piercing.' },
          ];
          const wpn = weapons[Phaser.Math.Between(0, weapons.length - 1)];
          this.registry.set('shopWeapon', wpn);
        },
      },
      {
        name: 'Random Passive',
        description: 'Speed / Shield / Tri-Shot',
        price: 7,
        bought: false,
        color: '#aa44ff',
        onBuy: () => {
          const passives: ('speed' | 'shield' | 'trishot')[] = ['speed', 'shield', 'trishot'];
          const p = passives[Phaser.Math.Between(0, passives.length - 1)];
          this.registry.set('shopPassive', p);
        },
      },
    ];
  }

  private drawItems(): void {
    this.itemCards.forEach(c => c.destroy());
    this.itemCards = [];

    const startX = 120;
    const cardW = 180;
    const cardH = 260;
    const gap = 30;

    for (let i = 0; i < this.items.length; i++) {
      const item = this.items[i];
      const cx = startX + i * (cardW + gap) + cardW / 2;
      const cy = 290;
      const canAfford = this.gold >= item.price && !item.bought;

      const container = this.add.container(cx, cy);

      const bgColor = !canAfford ? 0x222233 : (item.bought ? 0x222233 : 0x1a1a3e);
      const bg = this.add.rectangle(0, 0, cardW, cardH, bgColor);
      bg.setStrokeStyle(1, canAfford && !item.bought ? 0x44aaff : 0x333355);
      container.add(bg);

      const nameText = this.add.text(0, -90, item.name, {
        fontSize: '16px',
        color: item.bought ? '#666666' : item.color,
        fontFamily: 'monospace',
        fontStyle: 'bold',
      });
      nameText.setOrigin(0.5);
      container.add(nameText);

      const descText = this.add.text(0, -50, item.description, {
        fontSize: '12px',
        color: '#888888',
        fontFamily: 'monospace',
      });
      descText.setOrigin(0.5);
      container.add(descText);

      const priceText = this.add.text(0, 30, item.bought ? 'SOLD' : `${item.price} gold`, {
        fontSize: '18px',
        color: item.bought ? '#666666' : (canAfford ? '#ffcc44' : '#ff4444'),
        fontFamily: 'monospace',
        fontStyle: 'bold',
      });
      priceText.setOrigin(0.5);
      container.add(priceText);

      if (!canAfford && !item.bought) {
        const needText = this.add.text(0, 60, 'Not enough gold', {
          fontSize: '10px',
          color: '#ff4444',
          fontFamily: 'monospace',
        });
        needText.setOrigin(0.5);
        container.add(needText);
      }

      if (!item.bought && canAfford) {
        container.setSize(cardW, cardH);
        container.setInteractive({ cursor: 'pointer' });
        container.on('pointerover', () => {
          bg.setFillStyle(0x2a2a5e);
        });
        container.on('pointerout', () => {
          bg.setFillStyle(0x1a1a3e);
        });
        container.on('pointerdown', () => {
          this.buyItem(i);
        });
      }

      this.itemCards.push(container);
    }
  }

  private buyItem(index: number): void {
    const item = this.items[index];
    if (item.bought || this.gold < item.price) return;

    this.gold -= item.price;
    item.bought = true;
    item.onBuy();
    this.registry.set('gold', this.gold);

    audio.playShopBuy();
    this.goldText.setText(`Gold: ${this.gold}`);

    const boughtText = this.add.text(400, 340, `Purchased: ${item.name}!`, {
      fontSize: '18px',
      color: item.color,
      fontFamily: 'monospace',
      fontStyle: 'bold',
    });
    boughtText.setOrigin(0.5);
    boughtText.setDepth(10);
    this.tweens.add({
      targets: boughtText,
      y: 300,
      alpha: 0,
      duration: 800,
      delay: 600,
      onComplete: () => boughtText.destroy(),
    });

    this.drawItems();
  }

  private leaveShop(): void {
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('DungeonScene', {
        floorNumber: this.floorNumber + 1,
        gold: this.gold,
      });
    });
  }
}
