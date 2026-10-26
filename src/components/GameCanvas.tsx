import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { createGame } from '../game/GameScene';

interface Props { stage: number; onReady: (game: Phaser.Game) => void; }

export function GameCanvas({ stage, onReady }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  useEffect(() => {
    if (!host.current) return;
    const game = createGame(host.current);
    gameRef.current = game;
    game.events.once('ready', () => {
      onReady(game);
      const scene = game.scene.getScene('GameScene');
      scene.events.emit('reset-game', stage);
    });
    return () => {
      game.destroy(true);
      gameRef.current = null;
    };
    // Only create/destroy once per mount; stage changes are handled by reset on entry.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return <div className="game-canvas-host" ref={host} aria-label="สนามต่อสู้ Quiz Defense" />;
}
