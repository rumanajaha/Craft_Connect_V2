import { Outfit, Playfair_Display } from 'next/font/google';
import '@/styles/globals.css';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
});

export const metadata = {
  title: 'CraftConnect — Handcrafted. Connected.',
  description: 'An AI-powered discovery and collaboration platform where handmade brands connect with creative creators and discerning customers.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${outfit.variable} ${playfair.variable}`} suppressHydrationWarning>
      <body className="bg-cream text-brand-dark antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
