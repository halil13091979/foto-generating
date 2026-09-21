export type RaysOperation =
  | 'photo-1k'
  | 'photo-2k'
  | 'photo-4k'
  | 'improve'
  | 'video-5s'
  | 'video-10s';

export type RaysPlan = {
  id: string;
  name: string;
  price: number;
  rays: number;
  description: string;
  highlight?: boolean;
};

export const RAYS_PER_OPERATION: Record<RaysOperation, number> = {
  'photo-1k': 4,
  'photo-2k': 4,
  'photo-4k': 6,
  improve: 2,
  'video-5s': 16,
  'video-10s': 32,
};

export const OPERATION_LABELS: Record<RaysOperation, string> = {
  'photo-1k': 'Фото 1K',
  'photo-2k': 'Фото 2K',
  'photo-4k': 'Фото 4K',
  improve: 'Улучшение',
  'video-5s': 'Видео 5 сек',
  'video-10s': 'Видео 10 сек',
};

export const RAYS_PLANS: RaysPlan[] = [
  { id: 'start', name: 'Старт', price: 990, rays: 800, description: 'Идеально для первых тестов и небольших партий товара.' },
  { id: 'studio', name: 'Студия', price: 3990, rays: 4200, description: 'Для регулярной генерации карточек и постоянной работы.', highlight: true },
  { id: 'business', name: 'Бизнес', price: 12900, rays: 16000, description: 'Для агентств, складов и крупных каталогов товаров.' },
];

export const WELCOME_RAYS = Number(process.env.RAYS_WELCOME_BONUS ?? '6');

export function getRaysCost(operation: RaysOperation): number {
  return RAYS_PER_OPERATION[operation];
}

export function getRaysPerRuble(plan: RaysPlan): number {
  return plan.rays / plan.price;
}

export function estimateOperations(rays: number, operation: RaysOperation): number {
  const cost = getRaysCost(operation);
  if (cost <= 0) return 0;
  return Math.floor(rays / cost);
}

export function formatRays(value: number): string {
  return `${value.toLocaleString('ru-RU')} лучей`;
}
