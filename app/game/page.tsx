'use client';

import dynamic from 'next/dynamic';

const GameClient = dynamic(() => import('./GameClient'), { ssr: false });

export default function GamePage() {
  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: '#0f0f23',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    }}>
      <GameClient />
    </div>
  );
}
