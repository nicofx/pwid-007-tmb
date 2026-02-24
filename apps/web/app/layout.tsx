import type { Metadata } from 'next';
import { JetBrains_Mono, Manrope, Plus_Jakarta_Sans } from 'next/font/google';
import { AppFooter } from '@/components/layout/AppFooter';
import { AppHeader } from '@/components/layout/AppHeader';
import { PageViewTracker } from '@/components/common/PageViewTracker';
import { ToastProvider } from '@/components/ui/ToastProvider';
import '../styles/tokens.css';
import '../styles/typography.css';
import './globals.css';

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-manrope'
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-plus-jakarta'
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-jetbrains-mono'
});

export const metadata: Metadata = {
  title: 'Take Me Back — Dev',
  description: 'Juego narrativo por turnos con estado persistente'
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>): React.ReactElement {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${manrope.variable} ${plusJakarta.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
        <ToastProvider>
          <PageViewTracker />
          <AppHeader />
          {children}
          <AppFooter />
        </ToastProvider>
      </body>
    </html>
  );
}
