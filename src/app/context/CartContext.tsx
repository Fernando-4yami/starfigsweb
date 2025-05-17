// app/context/CartContext.tsx
'use client';
import { createContext, useContext, useState, useEffect } from 'react';

// Definimos la interfaz Product para tipado seguro
interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  [key: string]: any; // Para propiedades adicionales
}

type CartItem = Product & { quantity: number };

// Tipo para el contexto con todas las funciones necesarias
type CartContextType = {
  cart: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (id: string) => void;
  incrementQuantity: (id: string) => void;
  decrementQuantity: (id: string) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
};

// Creamos el contexto con valores iniciales
const CartContext = createContext<CartContextType>({
  cart: [],
  addToCart: () => {},
  removeFromCart: () => {},
  incrementQuantity: () => {},
  decrementQuantity: () => {},
  clearCart: () => {},
  totalItems: 0,
  totalPrice: 0,
});

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>(() => {
    // Intenta cargar el carrito desde localStorage si existe
    if (typeof window !== 'undefined') {
      const savedCart = localStorage.getItem('cart');
      return savedCart ? JSON.parse(savedCart) : [];
    }
    return [];
  });

  // Persistir el carrito en localStorage cuando cambia
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  // Agregar producto al carrito
  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.id === product.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  // Eliminar producto del carrito
  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  // Incrementar cantidad de un producto
  const incrementQuantity = (id: string) => {
    setCart(prev =>
      prev.map(item =>
        item.id === id 
          ? { ...item, quantity: item.quantity + 1 } 
          : item
      )
    );
  };

  // Decrementar cantidad de un producto (no baja de 1)
  const decrementQuantity = (id: string) => {
    setCart(prev =>
      prev.map(item =>
        item.id === id 
          ? { ...item, quantity: Math.max(1, item.quantity - 1) } 
          : item
      )
    );
  };

  // Vaciar el carrito completamente
  const clearCart = () => {
    setCart([]);
  };

  // Calcular total de items
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Calcular precio total
  const totalPrice = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        incrementQuantity,
        decrementQuantity,
        clearCart,
        totalItems,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);