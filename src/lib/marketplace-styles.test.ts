import { describe, expect, it } from 'vitest';
import { buildMarketplacePrompt, getExportPreset } from './marketplace-styles';

describe('marketplace prompt builder', () => {
  it('builds a focused marketplace prompt for a womens backpack', () => {
    const prompt = buildMarketplacePrompt({
      productName: 'Сумка Urban Day',
      category: 'Обувь и аксессуары',
      style: 'Studio premium',
      background: 'Лофт+мягкий свет',
      platform: 'Wildberries',
      keyBenefits: ['Водонепроницаемая', 'Объём 28 л', 'Удобная посадка'],
    });

    expect(prompt).toContain('Wildberries');
    expect(prompt).toContain('Urban Day');
    expect(prompt).toContain('Водонепроницаемая');
  });

  it('returns presets for major marketplaces', () => {
    expect(getExportPreset('Wildberries')).toMatchObject({
      aspectRatio: '1:1',
      maxText: 14,
    });
    expect(getExportPreset('Ozon')).toMatchObject({
      aspectRatio: '4:5',
      maxText: 12,
    });
  });
});
