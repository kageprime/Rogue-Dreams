import { SpriteRecipe } from '../types';

const BODY_SHAPES: Record<string, (g: CanvasRenderingContext2D, s: number, c: string) => void> = {
  blob: (g, s, c) => { g.fillStyle = c; g.beginPath(); g.arc(s / 2, s / 2, s / 2 - 1, 0, Math.PI * 2); g.fill(); },
  square: (g, s, c) => { g.fillStyle = c; g.fillRect(1, 1, s - 2, s - 2); },
  triangle: (g, s, c) => { g.fillStyle = c; g.beginPath(); g.moveTo(s / 2, 2); g.lineTo(s - 2, s - 2); g.lineTo(2, s - 2); g.closePath(); g.fill(); },
  diamond: (g, s, c) => { g.fillStyle = c; g.beginPath(); g.moveTo(s / 2, 1); g.lineTo(s - 1, s / 2); g.lineTo(s / 2, s - 1); g.lineTo(1, s / 2); g.closePath(); g.fill(); },
  cross: (g, s, c) => { g.fillStyle = c; g.fillRect(s / 2 - 2, 2, 4, s - 4); g.fillRect(2, s / 2 - 2, s - 4, 4); },
  star: (g, s, c) => { g.fillStyle = c; const cx = s / 2, cy = s / 2; for (let i = 0; i < 4; i++) { const a = i * Math.PI / 4 + Math.PI / 8; g.fillRect(cx + Math.cos(a) * 2 - 1, cy + Math.sin(a) * 2 - 1, 2, s * 0.6); } },
};

const EYE_STYLES: Record<string, (g: CanvasRenderingContext2D, s: number) => void> = {
  dots: (g, s) => { g.fillStyle = '#fff'; g.fillRect(s * 0.25, s * 0.25, 2, 2); g.fillRect(s * 0.6, s * 0.25, 2, 2); },
  slits: (g, s) => { g.fillStyle = '#ff0'; g.fillRect(s * 0.2, s * 0.3, 4, 1); g.fillRect(s * 0.55, s * 0.3, 4, 1); },
  big: (g, s) => { g.fillStyle = '#fff'; g.beginPath(); g.arc(s * 0.3, s * 0.3, 3, 0, Math.PI * 2); g.fill(); g.beginPath(); g.arc(s * 0.7, s * 0.3, 3, 0, Math.PI * 2); g.fill(); },
  glow: (g, s) => { g.fillStyle = '#ff0'; g.beginPath(); g.arc(s * 0.3, s * 0.3, 4, 0, Math.PI * 2); g.fill(); g.beginPath(); g.arc(s * 0.7, s * 0.3, 4, 0, Math.PI * 2); g.fill(); },
};

export function generateSpriteTexture(
  ctx: CanvasRenderingContext2D,
  recipe: SpriteRecipe,
  size: number
): void {
  const shapeFn = BODY_SHAPES[recipe.body] || BODY_SHAPES.blob;
  const eyeFn = EYE_STYLES[recipe.eyes] || EYE_STYLES.dots;

  ctx.clearRect(0, 0, size, size);
  shapeFn(ctx, size, recipe.color);
  eyeFn(ctx, size);
}

export const DEFAULT_SPRITE_RECIPES: Record<string, SpriteRecipe> = {
  slime: { body: 'blob', color: '#44aa44', eyes: 'dots', size: 24 },
  bat: { body: 'triangle', color: '#8844aa', eyes: 'dots', size: 20 },
  imp: { body: 'square', color: '#cc4444', eyes: 'big', size: 28 },
  golem: { body: 'diamond', color: '#886644', eyes: 'slits', size: 32 },
  archer: { body: 'cross', color: '#44aaff', eyes: 'dots', size: 24 },
  mage: { body: 'star', color: '#aa44ff', eyes: 'glow', size: 26 },
  boss: { body: 'square', color: '#ff4444', eyes: 'big', size: 48 },
};
