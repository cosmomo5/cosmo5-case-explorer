export type StarState = 'reading' | 'selected' | 'ghost' | 'idle';

export interface StarAppearance {
  opacity: number;
  colorOverride?: number;
}

const APPEARANCE: Record<StarState, StarAppearance> = {
  reading:     { opacity: 1.0,  colorOverride: 0xe8b15a },
  selected:    { opacity: 1.0 },
  ghost:       { opacity: 0.25 },
  idle:        { opacity: 0.85 },
};

export function resolveStarAppearance(state: StarState): StarAppearance {
  return APPEARANCE[state];
}
