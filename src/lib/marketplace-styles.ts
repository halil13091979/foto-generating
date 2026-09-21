export type MarketplaceName = 'Wildberries' | 'Ozon' | 'Яндекс Маркет' | 'SberMarket';

export type PromptInput = {
  productName: string;
  category: string;
  style: string;
  background: string;
  platform: MarketplaceName;
  keyBenefits: string[];
};

export function buildMarketplacePrompt({
  productName,
  category,
  style,
  background,
  platform,
  keyBenefits,
}: PromptInput) {
  const benefitText = keyBenefits.length ? keyBenefits.join(', ') : 'Высокое качество, практичность';

  return [
    `Generate a premium product photography for ${productName} for ${platform}.`,
    `Category: ${category}.`,
    `Visual style: ${style}.`,
    `Background: ${background}.`,
    'Use soft natural lighting, realistic shadows, crisp edges, premium studio composition, high detail, commercial product photography aesthetics.',
    `Highlight the product benefits: ${benefitText}.`,
    'Avoid logos, watermark, text overlays, distortions, extra objects, hands, blurry background, low contrast.',
    'Output should be clean, modern, marketplace-ready, conversion-focused, with high sales appeal and excellent readability on mobile and desktop.',
  ].join(' ');
}

export function getExportPreset(platform: MarketplaceName) {
  const presets: Record<MarketplaceName, { aspectRatio: string; maxText: number; resolution: string }> = {
    Wildberries: { aspectRatio: '1:1', maxText: 14, resolution: '1600x1600' },
    Ozon: { aspectRatio: '4:5', maxText: 12, resolution: '1600x2000' },
    'Яндекс Маркет': { aspectRatio: '1:1', maxText: 13, resolution: '1600x1600' },
    SberMarket: { aspectRatio: '4:5', maxText: 11, resolution: '1600x2000' },
  };

  return presets[platform];
}
