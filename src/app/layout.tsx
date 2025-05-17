// src/app/layout.tsx
import Navbar from '../components/Navbar/Navbar';
import './globals.css';
import { CartProvider } from './context/CartContext';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>
        <CartProvider>
          <Navbar />
          <div className="container mx-auto px-4">
            {children} {/* Aquí aparece el contenido de cada página */}
          </div>
        </CartProvider>
      </body>
    </html>
  );
}