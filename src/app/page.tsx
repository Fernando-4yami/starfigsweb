// src/app/page.tsx
'use client';
import { useContext } from 'react';
import { useCart } from 'app/context/CartContext';

export default function Home() {
  const { cart } = useCart(); // Usa el hook useCart directamente

  return (
    <div>
      <h1>Bienvenido a Starfigs</h1>
      <p>Productos en el carrito: {cart.length}</p>
      {/* Aquí puedes seguir construyendo tu página */}
    </div>
  );
}