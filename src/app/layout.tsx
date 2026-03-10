import type { Metadata } from 'next';
import { Assistant, Frank_Ruhl_Libre } from 'next/font/google';
import './globals.css';

const assistant = Assistant({ 
  subsets: ['hebrew', 'latin'],
  variable: '--font-assistant',
  display: 'swap',
});

const frankRuhlLibre = Frank_Ruhl_Libre({ 
  subsets: ['hebrew', 'latin'],
  variable: '--font-frank',
  weight: ['400', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'מערכת לוח טהרה',
  description: 'מערכת הלכתית לניהול לוח טהרה (נידה)',
  manifest: '/manifest.json',
  themeColor: '#6366f1',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'לוח טהרה',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="he" dir="rtl" className={`${assistant.variable} ${frankRuhlLibre.variable}`} suppressHydrationWarning>
      <body className="font-sans bg-background text-foreground antialiased">
        <main className="min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
