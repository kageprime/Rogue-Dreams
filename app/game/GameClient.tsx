'use client';

import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { gameConfig } from '@/game/config';

export default function GameClient() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (gameRef.current || !containerRef.current) return;

    const config: Phaser.Types.Core.GameConfig = {
      ...gameConfig,
      parent: containerRef.current,
    };

    gameRef.current = new Phaser.Game(config);

    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []);

  return (
    <div
      ref={containerRef}
      id="game-container"
      style={{
        width: '800px',
        height: '600px',
        imageRendering: 'pixelated',
      }}
    />
  );
}
