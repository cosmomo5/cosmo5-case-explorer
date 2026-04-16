import { describe, it, expect } from 'vitest';
import { resolveStarAppearance } from './star-state';

describe('resolveStarAppearance', () => {
  it("reading → opacity 1.0 with colorOverride 0xe8b15a", () => {
    const result = resolveStarAppearance('reading');
    expect(result.opacity).toBe(1.0);
    expect(result.colorOverride).toBe(0xe8b15a);
  });

  it("selected → opacity 1.0, no colorOverride", () => {
    const result = resolveStarAppearance('selected');
    expect(result.opacity).toBe(1.0);
    expect(result.colorOverride).toBeUndefined();
  });

  it("ghost → opacity 0.25", () => {
    const result = resolveStarAppearance('ghost');
    expect(result.opacity).toBe(0.25);
    expect(result.colorOverride).toBeUndefined();
  });

  it("filterMatch → opacity 0.85", () => {
    const result = resolveStarAppearance('filterMatch');
    expect(result.opacity).toBe(0.85);
    expect(result.colorOverride).toBeUndefined();
  });

  it("filterDim → opacity 0.12", () => {
    const result = resolveStarAppearance('filterDim');
    expect(result.opacity).toBe(0.12);
    expect(result.colorOverride).toBeUndefined();
  });

  it("idle → opacity 0.85", () => {
    const result = resolveStarAppearance('idle');
    expect(result.opacity).toBe(0.85);
    expect(result.colorOverride).toBeUndefined();
  });

  it("colorOverride is undefined for all states except reading", () => {
    const states = ['selected', 'ghost', 'filterMatch', 'filterDim', 'idle'] as const;
    for (const state of states) {
      expect(resolveStarAppearance(state).colorOverride).toBeUndefined();
    }
  });
});
