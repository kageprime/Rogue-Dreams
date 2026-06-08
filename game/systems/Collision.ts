import Phaser from 'phaser';
import { TILE_SIZE, TILE_WALL } from '../types';

export class CollisionSystem {
  private wallGroup: Phaser.Physics.Arcade.StaticGroup;

  constructor(scene: Phaser.Scene) {
    this.wallGroup = scene.physics.add.staticGroup();
  }

  buildFromMap(scene: Phaser.Scene, map: number[][]): void {
    this.wallGroup.clear(true, true);

    for (let row = 0; row < map.length; row++) {
      for (let col = 0; col < map[row].length; col++) {
        if (map[row][col] === TILE_WALL) {
          const tile = scene.add.rectangle(
            col * TILE_SIZE + TILE_SIZE / 2,
            row * TILE_SIZE + TILE_SIZE / 2,
            TILE_SIZE, TILE_SIZE, 0x444466
          );
          tile.setDepth(0);
          this.wallGroup.add(tile);
        }
      }
    }
  }

  getWallGroup(): Phaser.Physics.Arcade.StaticGroup {
    return this.wallGroup;
  }

  destroy(): void {
    this.wallGroup.destroy(true);
  }
}
