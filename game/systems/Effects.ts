import Phaser from 'phaser';

export class Effects {
  static shakeCamera(scene: Phaser.Scene, intensity: number = 0.005, duration: number = 100): void {
    scene.cameras.main.shake(duration, intensity);
  }

  static emitParticles(scene: Phaser.Scene, x: number, y: number, color: number, count: number = 8): void {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 30 + Math.random() * 60;
      const size = 2 + Math.random() * 3;
      const particle = scene.add.circle(x, y, size, color);
      particle.setDepth(15);

      scene.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        alpha: 0,
        scale: 0,
        duration: 300 + Math.random() * 300,
        ease: 'Power2',
        onComplete: () => particle.destroy(),
      });
    }
  }

  static showDamageNumber(scene: Phaser.Scene, x: number, y: number, amount: number): void {
    const txt = scene.add.text(x + Phaser.Math.Between(-8, 8), y, `${amount}`, {
      fontSize: '11px',
      color: '#ffffff',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    });
    txt.setOrigin(0.5);
    txt.setDepth(20);

    scene.tweens.add({
      targets: txt,
      y: y - 24,
      alpha: 0,
      duration: 500,
      ease: 'Power1',
      onComplete: () => txt.destroy(),
    });
  }

  static makeTrail(scene: Phaser.Scene, x: number, y: number, color: number): void {
    const trail = scene.add.circle(x, y, 3, color);
    trail.setAlpha(0.5);
    trail.setDepth(8);

    scene.tweens.add({
      targets: trail,
      alpha: 0,
      scale: 0.3,
      duration: 200,
      onComplete: () => trail.destroy(),
    });
  }


}
