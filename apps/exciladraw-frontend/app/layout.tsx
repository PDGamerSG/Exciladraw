import type { Metadata } from 'next';
import { Inter, Caveat } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const caveat = Caveat({ subsets: ['latin'], weight: ['500', '700'], variable: '--font-caveat' });

export const metadata: Metadata = {
  title: 'Sketchpad — The Open Drawing Canvas',
  description: 'An open-source, end-to-end encrypted whiteboard for teams.',
  twitter: { card: 'summary_large_image' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${caveat.variable}`}>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
