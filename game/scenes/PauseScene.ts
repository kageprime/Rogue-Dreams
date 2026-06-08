import Phaser from 'phaser';
import { audio } from '../systems/Audio';

export class PauseScene extends Phaser.Scene {
  private selected: number = 0;
  private upKey!: Phaser.Input.Keyboard.Key;
  private downKey!: Phaser.Input.Keyboard.Key;
  private enterKey!: Phaser.Input.Keyboard.Key;
  private escKey!: Phaser.Input.Keyboard.Key;
  private drawn: boolean = false;

  constructor() {
    super({ key: 'PauseScene' });
  }

  create(): void {
    this.selected = 0;
    this.drawn = false;

    const overlay = this.add.rectangle(400, 300, 800, 600, 0x000000, 0.6);
    overlay.setDepth(0);

    const pauseText = this.add.text(400, 140, 'PAUSED', {
      fontSize: '48px',
      color: '#44aaff',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    });
    pauseText.setOrigin(0.5);
    pauseText.setDepth(1);

    this.upKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
    this.downKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
    this.enterKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    this.escKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

    this.drawOptions();
  }

  private drawOptions(): void {
    if (this.drawn) {
      this.children.each((child) => {
        if (child.type === 'Text' && (child as Phaser.GameObjects.Text).style?.fontSize === '22px') {
          (child as Phaser.GameObjects.Text).destroy();
        }
      });
      this.children.each((child) => {
        if (child.type === 'Text' && (child as Phaser.GameObjects.Text).style?.fontSize === '11px') {
          (child as Phaser.GameObjects.Text).destroy();
        }
      });
    }
    this.drawn = true;

    const muted = audio.muted;
    const options = [
      { text: 'Resume', action: () => this.resumeGame() },
      { text: muted ? 'Unmute' : 'Mute', action: () => { audio.toggleMute(); this.drawOptions(); } },
      { text: 'Quit Run', action: () => this.quitGame() },
    ];

    const startY = 260;
    for (let i = 0; i < options.length; i++) {
      const prefix = i === this.selected ? '> ' : '  ';
      const color = i === this.selected ? '#44ff44' : '#888888';
      const txt = this.add.text(400, startY + i * 44, `${prefix}${options[i].text}`, {
        fontSize: '22px',
        color,
        fontFamily: 'monospace',
      });
      txt.setOrigin(0.5);
      txt.setDepth(1);
    }

    const hint = this.add.text(400, 440, 'UP/DOWN to navigate  ·  ENTER to select  ·  ESC to resume', {
      fontSize: '11px',
      color: '#666688',
      fontFamily: 'monospace',
    });
    hint.setOrigin(0.5);
    hint.setDepth(1);
  }

  update(): void {
    if (Phaser.Input.Keyboard.JustDown(this.escKey)) {
      this.resumeGame();
      return;
    }

    if (Phaser.Input.Keyboard.JustDown(this.upKey)) {
      this.selected = (this.selected - 1 + 3) % 3;
      this.drawOptions();
      return;
    }

    if (Phaser.Input.Keyboard.JustDown(this.downKey)) {
      this.selected = (this.selected + 1) % 3;
      this.drawOptions();
      return;
    }

    if (Phaser.Input.Keyboard.JustDown(this.enterKey)) {
      const muted = audio.muted;
      const actions = [
        () => this.resumeGame(),
        () => { audio.toggleMute(); this.drawOptions(); },
        () => this.quitGame(),
      ];
      actions[this.selected]();
    }
  }

  private resumeGame(): void {
    this.scene.resume('DungeonScene');
    this.scene.stop();
  }

  private quitGame(): void {
    this.scene.stop('DungeonScene');
    this.scene.stop('GameUI');
    this.registry.set('gold', 0);
    this.registry.set('totalScore', 0);
    this.registry.set('totalKills', 0);
    this.scene.start('TitleScene');
  }
}
