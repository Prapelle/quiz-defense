// Original offline vector sprites for the ten Thai ghosts.
// Each frame is hand-drawn SVG artwork; no emoji glyphs or network assets are required.
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="128" viewBox="0 0 320 128">
<defs>
 <linearGradient id="body" x2="0.2" y2="1"><stop stop-color="#f5f3ff"/><stop offset="1" stop-color="#9aa9c9"/></linearGradient>
 <radialGradient id="aura"><stop stop-color="#9cecff" stop-opacity=".6"/><stop offset="1" stop-color="#9cecff" stop-opacity="0"/></radialGradient>
 <filter id="glow"><feGaussianBlur stdDeviation="2.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
</defs>
<g stroke="#17182e" stroke-width="3" stroke-linejoin="round" stroke-linecap="round">
<!-- 1: Tani, banana-leaf spirit -->
<g transform="translate(0 0)"><ellipse cx="32" cy="57" rx="27" ry="30" fill="url(#aura)"/><path d="M12 50 Q10 22 31 17 Q54 20 52 48 L57 63 48 59 42 67 32 61 21 68 17 58 8 62Z" fill="#6dc77d"/><path d="M22 20 Q34 4 45 18 Q34 21 27 31Z" fill="#a7ee8d"/><ellipse cx="25" cy="43" rx="5" ry="7" fill="#f8f5d7"/><ellipse cx="41" cy="43" rx="5" ry="7" fill="#f8f5d7"/><circle cx="26" cy="44" r="2.5" fill="#2b263b"/><circle cx="40" cy="44" r="2.5" fill="#2b263b"/><path d="M27 54 Q33 60 40 53" fill="none" stroke="#482a3a"/></g>
<!-- 2: Krasue, floating head with glowing entrail -->
<g transform="translate(64 0)"><ellipse cx="32" cy="48" rx="27" ry="34" fill="url(#aura)"/><path d="M14 37 Q14 13 33 13 Q52 14 51 37 L47 51 Q34 64 20 51Z" fill="#f4c8c5"/><path d="M17 29 Q30 2 49 27 Q35 18 17 29Z" fill="#211d38"/><ellipse cx="25" cy="37" rx="4" ry="6" fill="#c61d55"/><ellipse cx="40" cy="37" rx="4" ry="6" fill="#c61d55"/><path d="M28 48 Q34 53 40 47" fill="none" stroke="#7d244d"/><path d="M28 57 C17 65 44 69 27 78 C17 84 37 87 32 96" fill="none" stroke="#fa5f82" stroke-width="6" filter="url(#glow)"/><circle cx="32" cy="96" r="4" fill="#ffbe78"/></g>
<!-- 3: Pret, tall hungry ghost -->
<g transform="translate(128 0)"><ellipse cx="32" cy="58" rx="26" ry="30" fill="url(#aura)"/><path d="M19 14 L28 14 32 2 36 14 45 14 48 45 44 70 39 62 33 74 27 62 20 71 16 44Z" fill="#b7b2d9"/><path d="M21 28 Q32 20 44 28 L42 41 22 41Z" fill="#43334f"/><ellipse cx="26" cy="33" rx="3" ry="4" fill="#fff2a0"/><ellipse cx="39" cy="33" rx="3" ry="4" fill="#fff2a0"/><path d="M26 47 L40 47 33 59Z" fill="#261b36"/><path d="M27 47 L32 53 36 47" fill="#fff"/></g>
<!-- 4: Krahang, flying spirit with woven wings -->
<g transform="translate(192 0)"><ellipse cx="32" cy="48" rx="29" ry="29" fill="url(#aura)"/><path d="M25 30 Q8 11 2 30 L18 48 4 51 24 59 32 46Z" fill="#b78351"/><path d="M39 30 Q56 11 62 30 L46 48 60 51 40 59 32 46Z" fill="#b78351"/><path d="M23 25 Q32 14 41 25 L43 44 39 56 32 52 25 56 21 44Z" fill="#d7b47e"/><path d="M25 34 L29 37 M35 37 L39 34" stroke="#342238" stroke-width="4"/><path d="M27 45 Q32 49 37 45" fill="none"/><path d="M23 56 L18 67 M41 56 L46 67" stroke="#cba06c" stroke-width="5"/></g>
<!-- 5: Pop, fanged demon -->
<g transform="translate(256 0)"><ellipse cx="32" cy="50" rx="28" ry="30" fill="url(#aura)"/><path d="M10 33 L18 15 28 23 36 12 44 23 55 17 54 43 49 58 41 63 32 58 23 64 15 55Z" fill="#a84f68"/><ellipse cx="24" cy="37" rx="5" ry="6" fill="#ffdc73"/><ellipse cx="41" cy="37" rx="5" ry="6" fill="#ffdc73"/><circle cx="24" cy="37" r="2" fill="#29162c"/><circle cx="41" cy="37" r="2" fill="#29162c"/><path d="M21 48 Q32 59 44 48 L40 59 35 52 31 60 26 52Z" fill="#fff4d9"/><path d="M16 28 L7 19 M48 28 L57 19" stroke="#f5b7c0" stroke-width="4"/></g>
<!-- 6: Kongkoi, tiny hopping ghost -->
<g transform="translate(0 64)"><ellipse cx="32" cy="48" rx="27" ry="25" fill="url(#aura)"/><path d="M13 47 Q11 24 31 23 Q52 24 51 47 L45 59 36 53 29 60 20 55Z" fill="#c8d6e7"/><ellipse cx="25" cy="39" rx="4" ry="5" fill="#32213e"/><ellipse cx="39" cy="39" rx="4" ry="5" fill="#32213e"/><path d="M26 48 Q32 53 38 48" fill="none"/><path d="M23 57 L15 65 M41 57 L49 65" stroke="#b7c9df" stroke-width="5"/></g>
<!-- 7: Phong, fire-crowned ghost -->
<g transform="translate(64 64)"><ellipse cx="32" cy="50" rx="28" ry="29" fill="url(#aura)"/><path d="M16 34 Q6 20 20 14 L25 25 Q25 5 34 4 Q42 16 39 25 L50 13 Q59 30 48 39 L48 52 40 62 31 56 22 62 15 51Z" fill="#e97843"/><path d="M21 36 Q21 25 32 25 Q44 25 44 37 L41 51 32 56 23 50Z" fill="#e4d3b4"/><ellipse cx="26" cy="38" rx="3.5" ry="5" fill="#4a2637"/><ellipse cx="38" cy="38" rx="3.5" ry="5" fill="#4a2637"/><path d="M27 47 L37 47 32 54Z" fill="#4a2637"/><path d="M21 21 L27 30 M42 20 L37 30" stroke="#ffe58d" stroke-width="3"/></g>
<!-- 8: Maemai, veiled widow -->
<g transform="translate(128 64)"><ellipse cx="32" cy="49" rx="28" ry="30" fill="url(#aura)"/><path d="M11 34 Q10 5 32 7 Q55 7 53 34 L48 58 42 64 32 57 22 64 16 56Z" fill="#24253e"/><path d="M18 30 Q32 18 46 30 L43 47 Q32 59 21 47Z" fill="#e7d7d4"/><path d="M15 31 Q32 21 49 31 L45 48 Q32 38 19 48Z" fill="#54445f"/><ellipse cx="26" cy="38" rx="3" ry="4" fill="#d8f7ff"/><ellipse cx="38" cy="38" rx="3" ry="4" fill="#d8f7ff"/><path d="M27 47 Q32 50 37 47" fill="none" stroke="#6c344e"/><path d="M14 18 L7 10 M50 18 L57 10" stroke="#b4a5cb" stroke-width="3"/></g>
<!-- 9: Taihong, skull revenant -->
<g transform="translate(192 64)"><ellipse cx="32" cy="49" rx="27" ry="29" fill="url(#aura)"/><path d="M13 32 Q13 13 32 13 Q51 13 51 32 L46 48 40 52 40 61 24 61 24 52 18 48Z" fill="#dedbd0"/><ellipse cx="24" cy="34" rx="6" ry="7" fill="#30263c"/><ellipse cx="40" cy="34" rx="6" ry="7" fill="#30263c"/><path d="M32 37 L27 46 36 46Z" fill="#5e5063"/><path d="M24 52 L24 58 M29 51 L29 59 M35 51 L35 59 M40 52 L40 58" stroke="#4b4052" stroke-width="2"/><path d="M16 21 L9 15 M48 21 L55 15" stroke="#e4e0d5" stroke-width="4"/></g>
<!-- 10: Khomot, mist phantom -->
<g transform="translate(256 64)"><ellipse cx="32" cy="48" rx="30" ry="31" fill="url(#aura)"/><path d="M14 37 Q11 19 28 15 Q43 10 51 28 L47 42 Q56 47 48 56 Q39 62 31 55 Q21 64 13 55 Q6 47 14 37Z" fill="#8ca8c4" fill-opacity=".9"/><path d="M20 34 Q25 28 30 34 M35 34 Q40 28 45 34" fill="none" stroke="#d8f6ff" stroke-width="4"/><ellipse cx="25" cy="39" rx="3" ry="4" fill="#18233d"/><ellipse cx="40" cy="39" rx="3" ry="4" fill="#18233d"/><path d="M27 48 Q32 51 37 48" fill="none" stroke="#2a3957"/><path d="M11 54 Q18 48 21 58 M42 58 Q49 48 55 54" fill="none" stroke="#b9e4f5" stroke-width="4"/></g>
</g></svg>`;
export const GHOST_ATLAS_DATA_URL = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
export const GHOST_FRAME_SIZE = 64;
export const GHOST_FRAMES = {
  tanian: 0, krasue: 1, pret: 2, krahang: 3, pop: 4,
  kongkoi: 5, phong: 6, maemai: 7, taihong: 8, khomot: 9,
} as const;

export function ghostSpriteBackgroundStyle(id: keyof typeof GHOST_FRAMES, size: number): import('react').CSSProperties {
  const frame = GHOST_FRAMES[id];
  return {
    backgroundImage: 'url("' + GHOST_ATLAS_DATA_URL + '")',
    backgroundSize: String(size * 5) + 'px ' + String(size * 2) + 'px',
    backgroundPosition: '-' + String((frame % 5) * size) + 'px -' + String(Math.floor(frame / 5) * size) + 'px',
    backgroundRepeat: 'no-repeat',
  };
}
