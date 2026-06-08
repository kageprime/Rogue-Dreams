import Phaser from 'phaser';

export class GameOverScene extends Phaser.Scene {
  private stats = { floor: 0, score: 0, gold: 0, kills: 0 };
  private flashTimer: number = 0;
  private restartText!: Phaser.GameObjects.Text;
  private enterKey!: Phaser.Input.Keyboard.Key;
  private escKey!: Phaser.Input.Keyboard.Key;
  private inputReady: boolean = false;

  constructor() {
    super({ key: 'GameOverScene' });
  }

  init(data: { floor?: number; score?: number; gold?: number; kills?: number }): void {
    this.stats.floor = data.floor || 0;
    this.stats.score = data.score || 0;
    this.stats.gold = data.gold || 0;
    this.stats.kills = data.kills || 0;
  }

  create(): void {
    this.inputReady = false;
    this.cameras.main.setBackgroundColor('#0a0a1a');

    const gameOver = this.add.text(400, 80, 'G A M E   O V E R', {
      fontSize: '40px',
      color: '#ff4444',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    });
    gameOver.setOrigin(0.5);
    gameOver.setAlpha(0);

    this.tweens.add({
      targets: gameOver,
      alpha: 1,
      y: { from: 40, to: 80 },
      duration: 600,
      ease: 'Back.easeOut',
    });

    const skull = this.add.text(400, 140, '\u2620', {
      fontSize: '48px',
      color: '#ff6644',
    });
    skull.setOrigin(0.5);
    skull.setAlpha(0);

    this.tweens.add({
      targets: skull,
      alpha: 1,
      duration: 400,
      delay: 300,
    });

    const lines = [
      `Floor Reached:  ${this.stats.floor}`,
      `Score:           ${this.stats.score}`,
      `Gold Collected:  ${this.stats.gold}`,
      `Enemies Killed:  ${this.stats.kills}`,
    ];

    const statsY = 240;
    for (let i = 0; i < lines.length; i++) {
      const line = this.add.text(310, statsY + i * 36, lines[i], {
        fontSize: '16px',
        color: '#c8c8d8',
        fontFamily: 'monospace',
      });
      line.setAlpha(0);
      this.tweens.add({
        targets: line,
        alpha: 1,
        x: { from: 280, to: 310 },
        duration: 300,
        delay: 400 + i * 120,
        ease: 'Power2',
      });
    }

    this.restartText = this.add.text(400, 460, 'PRESS ENTER TO RESTART', {
      fontSize: '16px',
      color: '#44ff44',
      fontFamily: 'monospace',
    });
    this.restartText.setOrigin(0.5);
    this.restartText.setAlpha(0);

    this.tweens.add({
      targets: this.restartText,
      alpha: 1,
      duration: 400,
      delay: 1000,
    });

    const escText = this.add.text(400, 500, 'ESC for Title Screen', {
      fontSize: '12px',
      color: '#666688',
      fontFamily: 'monospace',
    });
    escText.setOrigin(0.5);

    this.enterKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    this.escKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

    this.time.delayedCall(1200, () => {
      this.inputReady = true;
    });
  }

  update(_time: number, delta: number): void {
    this.flashTimer += delta;
    if (this.flashTimer > 500) {
      this.flashTimer = 0;
      this.restartText.setVisible(!this.restartText.visible);
    }

    if (!this.inputReady) return;

    if (Phaser.Input.Keyboard.JustDown(this.enterKey)) {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('BootScene');
      });
      this.inputReady = false;
    } else if (Phaser.Input.Keyboard.JustDown(this.escKey)) {
      this.scene.start('TitleScene');
      this.inputReady = false;
    }
  }
}
