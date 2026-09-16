import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Nexa — Your Personal AI Agent',
  description: 'Neural Engine eXecutive Assistance',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={'antialiased ' + geistSans.variable + ' ' + geistMono.variable}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
