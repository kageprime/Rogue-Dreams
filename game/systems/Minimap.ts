import Phaser from 'phaser';
import { Room, TILE_SIZE } from '../types';
import { Player } from '../entities/Player';

export class Minimap {
  private graphics: Phaser.GameObjects.Graphics;
  private discoveredRooms: Set<number> = new Set();
  private rooms: Room[] = [];
  private mapPixelWidth: number = 0;
  private mapPixelHeight: number = 0;
  private minimapWidth: number = 160;
  private minimapHeight: number = 120;
  private offsetX: number;
  private offsetY: number;
  private playerDot!: Phaser.GameObjects.Arc;
  private exitDot!: Phaser.GameObjects.Arc;

  constructor(scene: Phaser.Scene, rooms: Room[], mapWidth: number, mapHeight: number) {
    this.rooms = rooms;
    this.mapPixelWidth = mapWidth;
    this.mapPixelHeight = mapHeight;
    this.offsetX = scene.scale.width - this.minimapWidth - 10;
    this.offsetY = 10;

    this.graphics = scene.add.graphics();
    this.graphics.setDepth(30);
    this.graphics.setScrollFactor(0);

    this.playerDot = scene.add.circle(this.offsetX + 4, this.offsetY + 4, 3, 0x44aaff);
    this.playerDot.setDepth(31);
    this.playerDot.setScrollFactor(0);

    this.exitDot = scene.add.circle(0, 0, 3, 0x44ff44);
    this.exitDot.setDepth(31);
    this.exitDot.setScrollFactor(0);
  }

  discoverRoom(playerX: number, playerY: number): void {
    const tileX = Math.floor(playerX / TILE_SIZE);
    const tileY = Math.floor(playerY / TILE_SIZE);
    for (let i = 0; i < this.rooms.length; i++) {
      const r = this.rooms[i];
      if (tileX >= r.x && tileX < r.x + r.w && tileY >= r.y && tileY < r.y + r.h) {
        this.discoveredRooms.add(i);
      }
    }
  }

  update(player: Player, exitSprite: Phaser.GameObjects.Rectangle | null): void {
    this.graphics.clear();

    this.graphics.fillStyle(0x000000, 0.6);
    this.graphics.fillRect(this.offsetX, this.offsetY, this.minimapWidth, this.minimapHeight);
    this.graphics.lineStyle(1, 0x444466);
    this.graphics.strokeRect(this.offsetX, this.offsetY, this.minimapWidth, this.minimapHeight);

    const scaleX = this.minimapWidth / this.mapPixelWidth;
    const scaleY = this.minimapHeight / this.mapPixelHeight;

    for (let i = 0; i < this.rooms.length; i++) {
      if (!this.discoveredRooms.has(i)) continue;
      const r = this.rooms[i];
      const rx = this.offsetX + r.x * TILE_SIZE * scaleX;
      const ry = this.offsetY + r.y * TILE_SIZE * scaleY;
      const rw = r.w * TILE_SIZE * scaleX;
      const rh = r.h * TILE_SIZE * scaleY;

      this.graphics.lineStyle(1, 0x555577);
      this.graphics.strokeRect(rx, ry, rw, rh);
      this.graphics.fillStyle(0x333355, 0.5);
      this.graphics.fillRect(rx, ry, rw, rh);
    }

    if (player.alive) {
      this.playerDot.setPosition(
        this.offsetX + player.sprite.x * scaleX,
        this.offsetY + player.sprite.y * scaleY
      );
      this.playerDot.setVisible(true);
    } else {
      this.playerDot.setVisible(false);
    }

    if (exitSprite && exitSprite.active) {
      this.exitDot.setPosition(
        this.offsetX + exitSprite.x * scaleX,
        this.offsetY + exitSprite.y * scaleY
      );
      this.exitDot.setVisible(true);
    } else {
      this.exitDot.setVisible(false);
    }
  }

  destroy(): void {
    this.graphics.destroy();
    this.playerDot.destroy();
    this.exitDot.destroy();
  }
}
