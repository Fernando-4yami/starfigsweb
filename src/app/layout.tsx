// src/app/layout.tsx
import '@/styles/globals.css';
import Navbar from '@/components/Navbar/Navbar';
import { CartProvider } from '@/app/context/CartContext';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'StarFigs',
  description: 'Tienda de figuras de acción',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <CartProvider>
          <Navbar />
          <div className="container mx-auto px-4">{children}</div>
        </CartProvider>
      </body>
    </html>
  );
}
