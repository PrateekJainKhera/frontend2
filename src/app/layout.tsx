// src/app/layout.tsx
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { LanguageProvider } from '@/context/LanguageContext';
import Script from 'next/script';
import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: 'GPH Management Portal',
  description: 'GPH Publications Sales Team Management',
};
export default function RootLayout({ children }: { children: React.ReactNode; }) {
  return (
    <html lang="en">
      <head>
        {/* Load Google Maps API globally with Places library */}
        <Script
          src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&loading=async`}
          strategy="beforeInteractive"
        />
      </head>
      <body className="bg-gray-50">
        <AuthProvider>
          <LanguageProvider>
            {children}
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}