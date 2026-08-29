import type { Metadata, Viewport } from 'next';
import { fontVariables, inter } from '@/lib/fonts';
import './globals.css';

const title = 'Exciladraw — a whiteboard your whole team can draw on';
const description =
  'An open-source, real-time collaborative whiteboard. Shapes, arrows and freehand strokes on an infinite canvas, synced live with everyone in the room.';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: {
    default: title,
    template: '%s · Exciladraw',
  },
  description,
  applicationName: 'Exciladraw',
  openGraph: { title, description, type: 'website', siteName: 'Exciladraw' },
  twitter: { card: 'summary_large_image', title, description },
};

export const viewport: Viewport = {
  // the canvas fills the window, so a pinch-zoom of the page itself would
  // fight the board's own zoom
  themeColor: '#0b0d12',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${fontVariables}`}>
      <body className={`${inter.className} bg-ink-950 text-chalk-100`}>{children}</body>
    </html>
  );
}
