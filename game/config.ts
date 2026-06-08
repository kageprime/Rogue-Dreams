import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { TitleScene } from './scenes/TitleScene';
import { DungeonScene } from './scenes/DungeonScene';
import { GameUI } from './scenes/GameUI';
import { PauseScene } from './scenes/PauseScene';
import { GameOverScene } from './scenes/GameOverScene';
import { ShopScene } from './scenes/ShopScene';

export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 600;

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#1a1a2e',
  parent: 'game-container',
  input: {
    keyboard: {
      capture: [13, 27, 32, 38, 40],
    },
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  scene: [BootScene, TitleScene, DungeonScene, GameUI, PauseScene, GameOverScene, ShopScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
};
