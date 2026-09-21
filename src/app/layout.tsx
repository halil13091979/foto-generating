import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sooli | AI генерация фото для маркетплейсов',
  description: 'Sooli — премиальная AI-платформа для генерации продающих фото и карточек для маркетплейсов.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
