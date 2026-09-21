import { describe, expect, it } from 'vitest';
import {
  RAYS_PLANS,
  WELCOME_RAYS,
  estimateOperations,
  formatRays,
  getRaysCost,
  getRaysPerRuble,
} from './rays';

describe('rays currency', () => {
  it('charges 4 rays for 1K/2K photos and 6 rays for 4K', () => {
    expect(getRaysCost('photo-1k')).toBe(4);
    expect(getRaysCost('photo-2k')).toBe(4);
    expect(getRaysCost('photo-4k')).toBe(6);
  });

  it('charges 2 rays for improve and 16/32 for videos', () => {
    expect(getRaysCost('improve')).toBe(2);
    expect(getRaysCost('video-5s')).toBe(16);
    expect(getRaysCost('video-10s')).toBe(32);
  });

  it('estimates how many operations fit into a balance', () => {
    expect(estimateOperations(5000, 'photo-1k')).toBe(1250);
    expect(estimateOperations(5000, 'photo-4k')).toBe(833);
    expect(estimateOperations(5000, 'video-5s')).toBe(312);
  });

  it('describes plans with price, rays and rays per ruble', () => {
    expect(RAYS_PLANS).toHaveLength(3);
    const studio = RAYS_PLANS.find((plan) => plan.id === 'studio');
    expect(studio).toBeDefined();
    if (studio) {
      expect(getRaysPerRuble(studio)).toBeCloseTo(4200 / 3990, 5);
    }
  });

  it('grants welcome rays on signup', () => {
    expect(WELCOME_RAYS).toBe(6);
  });

  it('formats ray amounts for the russian locale', () => {
    expect(formatRays(2500)).toContain('2');
    expect(formatRays(2500)).toContain('лучей');
  });
});
