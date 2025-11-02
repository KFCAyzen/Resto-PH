import type { Metadata } from 'next';
import { SpeedInsights } from "@vercel/speed-insights/react";
import { Analytics } from "@vercel/analytics/react";
import './globals.css';

export const metadata: Metadata = {
  title: 'Paulina Hôtel - Menu Digital',
  description: 'Menu digital du restaurant Paulina Hôtel',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>
        {children}
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}