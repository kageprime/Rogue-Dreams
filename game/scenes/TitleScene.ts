import Phaser from 'phaser';

export class TitleScene extends Phaser.Scene {
  private startText!: Phaser.GameObjects.Text;
  private flashTimer: number = 0;
  private enterKey!: Phaser.Input.Keyboard.Key;
  private started: boolean = false;

  constructor() {
    super({ key: 'TitleScene' });
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#1a1a2e');
    this.started = false;

    const ascii = `  ██████╗  ██████╗  ██████╗ ██╗   ██╗███████╗
  ██╔══██╗██╔════╝ ██╔════╝ ██║   ██║██╔════╝
  ██████╔╝██║  ███╗██║  ███╗██║   ██║█████╗
  ██╔══██╗██║   ██║██║   ██║██║   ██║██╔══╝
  ██║  ██║╚██████╔╝╚██████╔╝╚██████╔╝███████╗
  ╚═╝  ╚═╝ ╚═════╝  ╚═════╝  ╚═════╝ ╚══════╝`;

    const title = this.add.text(400, 120, ascii, {
      fontSize: '11px',
      lineSpacing: -2,
      color: '#44aaff',
      fontFamily: 'monospace',
    });
    title.setOrigin(0.5);

    this.tweens.add({
      targets: title,
      scaleX: { from: 1, to: 1.03 },
      scaleY: { from: 1, to: 1.03 },
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    const subtitle = this.add.text(400, 200, 'D R E A M S', {
      fontSize: '14px',
      color: '#88aacc',
      fontFamily: 'monospace',
      letterSpacing: 8,
    });
    subtitle.setOrigin(0.5);

    this.tweens.add({
      targets: subtitle,
      alpha: { from: 0.6, to: 1 },
      duration: 2000,
      yoyo: true,
      repeat: -1,
    });

    this.startText = this.add.text(400, 280, 'PRESS ENTER TO START', {
      fontSize: '16px',
      color: '#44ff44',
      fontFamily: 'monospace',
    });
    this.startText.setOrigin(0.5);

    const controls = this.add.text(400, 500, 'WASD to move  ·  Mouse to aim  ·  Click to shoot', {
      fontSize: '12px',
      color: '#666688',
      fontFamily: 'monospace',
    });
    controls.setOrigin(0.5);

    this.enterKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
  }

  update(_time: number, delta: number): void {
    this.flashTimer += delta;
    if (this.flashTimer > 500) {
      this.flashTimer = 0;
      this.startText.setVisible(!this.startText.visible);
    }

    if (!this.started && Phaser.Input.Keyboard.JustDown(this.enterKey)) {
      this.started = true;
      this.registry.set('gold', 0);
      this.registry.set('totalScore', 0);
      this.registry.set('totalKills', 0);
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('BootScene');
      });
    }
  }
}
