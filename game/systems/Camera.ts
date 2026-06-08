import Phaser from 'phaser';
import { Player } from '../entities/Player';

export class CameraSystem {
  private camera: Phaser.Cameras.Scene2D.Camera;

  constructor(scene: Phaser.Scene, mapWidth: number, mapHeight: number) {
    this.camera = scene.cameras.main;
    this.camera.setBounds(0, 0, mapWidth, mapHeight);
  }

  follow(player: Player): void {
    this.camera.startFollow(player.sprite, true, 0.1, 0.1);
  }

  setZoom(zoom: number): void {
    this.camera.setZoom(zoom);
  }
}
