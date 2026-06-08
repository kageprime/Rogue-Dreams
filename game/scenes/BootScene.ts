import Phaser from 'phaser';
import { SpriteRecipe } from '../types';
import { generateSpriteTexture, DEFAULT_SPRITE_RECIPES } from '../generation/sprites';

const EXTRA_SPRITES: Record<string, SpriteRecipe> = {
  archer: { body: 'cross', color: '#44aaff', eyes: 'dots', size: 24 },
  mage: { body: 'star', color: '#aa44ff', eyes: 'glow', size: 26 },
  boss: { body: 'square', color: '#ff4444', eyes: 'big', size: 48 },
};

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#1a1a2e');

    const text = this.add.text(400, 300, 'Loading...', {
      fontSize: '24px',
      color: '#ffffff',
    });
    text.setOrigin(0.5);

    this.generateSpriteTextures();

    this.time.delayedCall(300, () => {
      this.scene.start('TitleScene');
    });
  }

  private generateSpriteTextures(): void {
    const all = { ...DEFAULT_SPRITE_RECIPES, ...EXTRA_SPRITES };
    for (const [key, recipe] of Object.entries(all)) {
      this.createTextureFromRecipe(`enemy_${key}`, recipe);
    }
  }

  private createTextureFromRecipe(key: string, recipe: SpriteRecipe): void {
    const size = recipe.size;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    generateSpriteTexture(ctx, recipe, size);

    if (this.textures.exists(key)) return;
    this.textures.addCanvas(key, canvas);
  }
}
