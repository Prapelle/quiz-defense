import type { CSSProperties } from 'react';
import type { GhostId } from '../game/config';

// Painted ghost and boss artwork lives in public/ as separate WebP files so the JS bundle
// stays small and the service worker can precache each image for offline play.
export const ghostArtUrl = (id: GhostId): string => `./ghosts/${id}.webp`;
export const bossArtUrl = (art: string): string => `./bosses/${art}.webp`;

export const ghostTextureKey = (id: GhostId): string => `ghost-${id}`;
export const bossTextureKey = (art: string): string => `boss-${art}`;

/** All boss artwork files, including the Saming tiger form used after its first defeat. */
export const BOSS_ART = ['nangram-boss', 'phrai', 'saming', 'saming-tiger'] as const;

export function ghostPortraitStyle(id: GhostId): CSSProperties {
  return {
    backgroundImage: `url("${ghostArtUrl(id)}")`,
    backgroundSize: 'contain',
    backgroundPosition: 'center bottom',
    backgroundRepeat: 'no-repeat',
  };
}
