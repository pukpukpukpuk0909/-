import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Тест на дальтонизм | Бесплатная диагностика',
  description: 'Профессиональная диагностика нарушений цветового зрения. Анонимно и бесплатно.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body className="bg-slate-50">
        <div className="min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}
