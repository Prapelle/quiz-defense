import { describe, expect, it } from 'vitest';
import { BOSSES, GAME_SETTINGS, GHOSTS, PLANTS, STAGES } from './config';

describe('game configuration', () => {
  it('starts with 200 mana and grants 5 mana for each ghost defeated', () => {
    expect(GAME_SETTINGS.startingMana).toBe(200);
    expect(GAME_SETTINGS.killManaReward).toBe(5);
  });

  it('asks a quiz every 15 seconds of real time', () => {
    expect(GAME_SETTINGS.questionIntervalMs).toBe(15000);
  });

  it('sets Kumarn to generate 10 mana every five seconds', () => {
    const kumarn = PLANTS.find((plant) => plant.id === 'kumarn')!;
    expect(kumarn.manaEveryMs).toBe(5000);
    expect(kumarn.manaGain).toBe(10);
    expect(kumarn.description).toContain('+10');
  });

  it('increases ghost attack damage by type', () => {
    expect(GHOSTS.slice(0, 3).map((ghost) => ghost.damage)).toEqual([5, 9, 15]);
  });

  it('contains five distinct player units with positive cost and health', () => {
    expect(PLANTS).toHaveLength(5);
    expect(new Set(PLANTS.map((plant) => plant.id)).size).toBe(5);
    for (const plant of PLANTS) {
      expect(plant.cost).toBeGreaterThan(0);
      expect(plant.hp).toBeGreaterThan(0);
    }
  });

  it('has the required mana, ranged, slowing, defensive and splash roles', () => {
    const kumarn = PLANTS.find((plant) => plant.id === 'kumarn')!;
    expect(kumarn.manaEveryMs).toBeGreaterThan(0);
    expect(kumarn.manaGain).toBeGreaterThan(0);
    expect(PLANTS.find((plant) => plant.id === 'lotus')?.attackRange).toBeGreaterThan(0);
    expect(PLANTS.find((plant) => plant.id === 'bindLotus')?.slowMs).toBeGreaterThan(0);
    expect(PLANTS.find((plant) => plant.id === 'ward')?.hp).toBeGreaterThan(PLANTS.find((plant) => plant.id === 'lotus')!.hp);
    expect(PLANTS.find((plant) => plant.id === 'fireLotus')?.splashRadius).toBeGreaterThan(0);
  });

  it('keeps attack roles distinct and broadly comparable in sustained damage', () => {
    const lotus = PLANTS.find((plant) => plant.id === 'lotus')!;
    const bindLotus = PLANTS.find((plant) => plant.id === 'bindLotus')!;
    const fireLotus = PLANTS.find((plant) => plant.id === 'fireLotus')!;
    const dps = (plant: typeof lotus) => plant.attackDamage * 1000 / plant.attackMs;

    expect(lotus.attackDamage).toBeGreaterThan(24);
    expect(bindLotus.slowMs).toBeGreaterThan(bindLotus.attackMs);
    expect(dps(bindLotus)).toBeLessThan(dps(lotus));
    expect(fireLotus.splashRadius).toBeGreaterThan(0);
    expect(dps(fireLotus)).toBeGreaterThan(dps(lotus) * 0.9);
    expect(dps(fireLotus)).toBeLessThan(dps(lotus) * 1.2);
  });

  it('defines increasing wave difficulty across stages', () => {
    expect(STAGES.map((stage) => stage.waves.reduce((sum, count) => sum + count, 0))).toEqual([10, 15, 20, 25, 30, 35, 40, 45, 50]);
    expect(STAGES[0].waveBreakMs).toBeGreaterThan(STAGES[8].waveBreakMs);
  });

  it('unlocks special plants only after the required correct-answer streak', () => {
    expect(PLANTS.filter((plant) => plant.unlockAtStreak === 0).map((plant) => plant.id)).toEqual(['kumarn', 'lotus']);
    expect(PLANTS.find((plant) => plant.id === 'bindLotus')?.unlockAtStreak).toBe(2);
    expect(PLANTS.find((plant) => plant.id === 'ward')?.unlockAtStreak).toBe(3);
    expect(PLANTS.find((plant) => plant.id === 'fireLotus')?.unlockAtStreak).toBe(4);
  });

  it('has ten distinct enemy types and makes the preta the tankiest and slowest', () => {
    expect(GHOSTS).toHaveLength(10);
    expect(new Set(GHOSTS.map((ghost) => ghost.id)).size).toBe(10);
    expect(GHOSTS.every((ghost) => ghost.emoji && ghost.description && ghost.hp > 0 && ghost.speed > 0 && ghost.damage > 0)).toBe(true);
    const preta = GHOSTS.find((ghost) => ghost.id === 'pret')!;
    expect(preta.hp).toBeGreaterThan(Math.max(...GHOSTS.filter((ghost) => ghost.id !== 'pret').map((ghost) => ghost.hp)));
    expect(preta.speed).toBeLessThan(Math.min(...GHOSTS.filter((ghost) => ghost.id !== 'pret').map((ghost) => ghost.speed)));
    expect(GHOSTS.filter((ghost) => ghost.flying).map((ghost) => ghost.id)).toEqual(['krasue', 'krahang']);
    expect(GHOSTS.find((ghost) => ghost.id === 'pop')?.enrageBelowHpRatio).toBe(0.5);
    expect(GHOSTS.find((ghost) => ghost.id === 'phong')?.poisonDamage).toBeGreaterThan(0);
    expect(GHOSTS.find((ghost) => ghost.id === 'maemai')?.speedAuraRadius).toBeGreaterThan(0);
    expect(GHOSTS.find((ghost) => ghost.id === 'taihong')?.deathBurstDamage).toBeGreaterThan(0);
    expect(GHOSTS.find((ghost) => ghost.id === 'khomot')?.damageReduction).toBe(0.25);
  });

  it('defines bosses for stages 3, 6 and 9 with the requested mechanics', () => {
    expect(BOSSES.map((boss) => boss.stage)).toEqual([3, 6, 9]);
    expect(BOSSES.map((boss) => boss.ability)).toEqual(['waterSurge', 'waterSurge', 'tigerShift']);
    expect(BOSSES[0].name).toContain('นางรำ');
    expect(BOSSES[1].name).toContain('ผีพราย');
    expect(BOSSES[2].name).toContain('สมิง');
    expect(BOSSES.every((boss) => boss.hp > 0 && boss.damage > 0 && boss.reward > 0)).toBe(true);
  });

  it('keeps five lanes and an increasing nine-stage difficulty curve', () => {
    expect(GAME_SETTINGS.gridRows).toBe(5);
    expect(STAGES).toHaveLength(9);
    expect(STAGES[0].enemies).toBeLessThan(STAGES[1].enemies);
    expect(STAGES[1].enemies).toBeLessThan(STAGES[2].enemies);
    expect(STAGES[0].spawnMs).toBeGreaterThan(STAGES[2].spawnMs);
    expect(STAGES.map((stage) => stage.allowedGhosts.length)).toEqual([2, 4, 6, 8, 10, 10, 10, 10, 10]);
    expect(STAGES[0].enemies).toBe(10);
    expect(STAGES[8].enemies).toBe(50);
    for (let index = 1; index < STAGES.length; index += 1) {
      expect(STAGES[index].enemies - STAGES[index - 1].enemies).toBe(5);
      expect(STAGES[index].allowedGhosts.slice(0, STAGES[index - 1].allowedGhosts.length)).toEqual(STAGES[index - 1].allowedGhosts);
    }
    const knownGhosts = new Set(GHOSTS.map((ghost) => ghost.id));
    for (const stage of STAGES) {
      expect(stage.allowedGhosts.length).toBeGreaterThan(0);
      for (const id of stage.allowedGhosts) expect(knownGhosts.has(id)).toBe(true);
    }
  });
});
