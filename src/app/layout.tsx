'use client';

import { Inter } from 'next/font/google';
import './globals.css';
import Footer from '@/components/Footer';

// Amplify設定の初期化
import '@/lib/amplify';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className={`${inter.className} flex flex-col min-h-screen`}>
        <main className="flex-grow">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
