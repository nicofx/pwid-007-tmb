import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Take Me Back — Dev',
  description: 'TMB baseline environment'
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>): React.ReactElement {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
