import { describe, expect, it } from 'vitest';
import { GAME_SETTINGS, GHOSTS, PLANTS, STAGES } from './config';

describe('game configuration', () => {
  it('contains five distinct player units with positive cost and health', () => {
    expect(PLANTS).toHaveLength(5);
    expect(new Set(PLANTS.map((plant) => plant.id)).size).toBe(5);
    for (const plant of PLANTS) {
      expect(plant.cost).toBeGreaterThan(0);
      expect(plant.hp).toBeGreaterThan(0);
    }
  });

  it('has the required mana, ranged, slowing, defensive and splash roles', () => {
    expect(PLANTS.find((plant) => plant.id === 'kumarn')?.manaEveryMs).toBeGreaterThan(0);
    expect(PLANTS.find((plant) => plant.id === 'lotus')?.attackRange).toBeGreaterThan(0);
    expect(PLANTS.find((plant) => plant.id === 'bindLotus')?.slowMs).toBeGreaterThan(0);
    expect(PLANTS.find((plant) => plant.id === 'ward')?.hp).toBeGreaterThan(PLANTS.find((plant) => plant.id === 'lotus')!.hp);
    expect(PLANTS.find((plant) => plant.id === 'fireLotus')?.splashRadius).toBeGreaterThan(0);
  });

  it('unlocks special plants only after the required correct-answer streak', () => {
    expect(PLANTS.filter((plant) => plant.unlockAtStreak === 0).map((plant) => plant.id)).toEqual(['kumarn', 'lotus']);
    expect(PLANTS.find((plant) => plant.id === 'bindLotus')?.unlockAtStreak).toBe(2);
    expect(PLANTS.find((plant) => plant.id === 'ward')?.unlockAtStreak).toBe(3);
    expect(PLANTS.find((plant) => plant.id === 'fireLotus')?.unlockAtStreak).toBe(4);
  });

  it('has three enemy types and makes the preta the tankiest and slowest', () => {
    expect(GHOSTS).toHaveLength(3);
    const preta = GHOSTS.find((ghost) => ghost.id === 'pret')!;
    expect(preta.hp).toBeGreaterThan(Math.max(...GHOSTS.filter((ghost) => ghost.id !== 'pret').map((ghost) => ghost.hp)));
    expect(preta.speed).toBeLessThan(Math.min(...GHOSTS.filter((ghost) => ghost.id !== 'pret').map((ghost) => ghost.speed)));
    expect(GHOSTS.some((ghost) => ghost.flying)).toBe(true);
  });

  it('keeps five lanes and an increasing three-stage difficulty curve', () => {
    expect(GAME_SETTINGS.gridRows).toBe(5);
    expect(STAGES).toHaveLength(3);
    expect(STAGES[0].enemies).toBeLessThan(STAGES[1].enemies);
    expect(STAGES[1].enemies).toBeLessThan(STAGES[2].enemies);
    expect(STAGES[0].spawnMs).toBeGreaterThan(STAGES[2].spawnMs);
    const knownGhosts = new Set(GHOSTS.map((ghost) => ghost.id));
    for (const stage of STAGES) {
      expect(stage.allowedGhosts.length).toBeGreaterThan(0);
      for (const id of stage.allowedGhosts) expect(knownGhosts.has(id)).toBe(true);
    }
  });
});
