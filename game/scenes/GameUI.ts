import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { Boss } from '../entities/Boss';
import { CombatSystem } from '../systems/Combat';

export class GameUI extends Phaser.Scene {
  private player!: Player;
  private combat!: CombatSystem;
  private boss: Boss | null = null;
  private hpText!: Phaser.GameObjects.Text;
  private weaponText!: Phaser.GameObjects.Text;
  private floorText!: Phaser.GameObjects.Text;
  private scoreText!: Phaser.GameObjects.Text;
  private bossBarBg!: Phaser.GameObjects.Rectangle;
  private bossBarFill!: Phaser.GameObjects.Rectangle;
  private bossNameText!: Phaser.GameObjects.Text;
  private itemsText!: Phaser.GameObjects.Text;
  private goldText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'GameUI' });
  }

  init(data: { player: Player; floor: number; combat: CombatSystem; boss: Boss | null }): void {
    this.player = data.player;
    this.combat = data.combat;
    this.boss = data.boss;

    if (this.boss) {
      this.boss.onHpChange = (hp: number, maxHp: number) => {
        this.updateBossBar(hp, maxHp);
      };
    }
  }

  create(): void {
    this.hpText = this.add.text(16, 16, '', { fontSize: '18px', color: '#ffffff', fontFamily: 'monospace' });
    this.weaponText = this.add.text(16, 38, '', { fontSize: '12px', color: '#cccccc', fontFamily: 'monospace' });
    this.itemsText = this.add.text(16, 54, '', { fontSize: '11px', color: '#aa88ff', fontFamily: 'monospace' });
    this.goldText = this.add.text(16, 70, '', { fontSize: '12px', color: '#ffcc44', fontFamily: 'monospace' });
    this.floorText = this.add.text(700, 16, '', { fontSize: '18px', color: '#ffffff', fontFamily: 'monospace' });
    this.scoreText = this.add.text(700, 38, '', { fontSize: '12px', color: '#cccccc', fontFamily: 'monospace' });

    if (this.boss) {
      this.bossBarBg = this.add.rectangle(400, 36, 300, 12, 0x333333);
      this.bossBarBg.setOrigin(0.5);
      this.bossBarFill = this.add.rectangle(400, 36, 300, 12, 0xff4444);
      this.bossBarFill.setOrigin(0.5);
      this.bossNameText = this.add.text(400, 18, this.boss.data.name || 'BOSS', {
        fontSize: '14px', color: '#ff6644', fontFamily: 'monospace', fontStyle: 'bold',
      });
      this.bossNameText.setOrigin(0.5);
      this.updateBossBar(this.boss.hp, this.boss.maxHp);
    }
  }

  private updateBossBar(hp: number, maxHp: number): void {
    if (this.bossBarFill) {
      const pct = Math.max(0, hp / maxHp);
      this.bossBarFill.setScale(pct, 1);
    }
  }

  update(): void {
    if (!this.player) return;

    const hpBar = '\u2588'.repeat(Math.max(0, this.player.hp)) +
                  '\u2591'.repeat(Math.max(0, this.player.maxHp - this.player.hp));
    this.hpText.setText(`HP: ${hpBar} ${this.player.hp}/${this.player.maxHp}`);
    this.weaponText.setText(`Weapon: ${this.player.weapon.name} (DMG: ${this.player.weapon.damage})`);

    const items: string[] = [];
    if (this.player.passiveItems.has('speed')) items.push('Boots');
    if (this.player.passiveItems.has('shield')) items.push('Shield');
    if (this.player.passiveItems.has('trishot')) items.push('Tri-Shot');
    this.itemsText.setText(items.length > 0 ? `Items: ${items.join(', ')}` : '');

    const scene = this.scene.get('DungeonScene') as unknown as { floorNumber?: number; gold?: number };
    if (scene.floorNumber !== undefined) {
      this.floorText.setText(`Floor: ${scene.floorNumber}`);
    }
    const gold = scene.gold !== undefined ? scene.gold : this.registry.get('gold') ?? 0;
    this.goldText.setText(`Gold: ${gold}`);

    this.scoreText.setText(`Score: ${this.combat.getScore()}`);

    if (this.boss && !this.boss.alive) {
      if (this.bossBarBg) this.bossBarBg.setVisible(false);
      if (this.bossBarFill) this.bossBarFill.setVisible(false);
      if (this.bossNameText) this.bossNameText.setVisible(false);
    }
  }
}
